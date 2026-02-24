import { NextRequest, NextResponse } from 'next/server'
import type { SyntheticPatient } from '@/types/patient.types'
import type { ClaudeEligibilityAnnotation } from '@/types/claude.types'
import type { EligibilityResponse } from '@/types/optum.types'
import { checkEligibility } from '@/lib/optum-eligibility'
import { annotateEligibility } from '@/lib/claude-annotator'

export async function POST(request: NextRequest) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 55000)

  try {
    const { patient } = (await request.json()) as { patient: SyntheticPatient }

    if (!patient) {
      return NextResponse.json({ error: 'Patient data required' }, { status: 400 })
    }

    const eligibilityStart = Date.now()
    let rawResponse: EligibilityResponse
    try {
      rawResponse = await checkEligibility(patient)
    } catch (error) {
      return NextResponse.json(
        { error: `Eligibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 502 }
      )
    }
    const eligibilityDuration = Date.now() - eligibilityStart

    const annotationStart = Date.now()
    let annotation: ClaudeEligibilityAnnotation | null = null
    try {
      annotation = await annotateEligibility({
        patient: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          insurancePlan: patient.insurancePlan,
          scenario: patient.scenario,
        },
        eligibilityResponse: rawResponse,
        requestedServiceType: 'routine office visit',
      })
    } catch (error) {
      console.error('Claude annotation failed, returning raw response:', error)
    }
    const annotationDuration = Date.now() - annotationStart

    return NextResponse.json({
      rawResponse,
      annotation,
      patient: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        insurancePlan: patient.insurancePlan,
        scenario: patient.scenario,
      },
      durationMs: {
        eligibility: eligibilityDuration,
        annotation: annotationDuration,
      },
    })
  } catch (error) {
    if (controller.signal.aborted) {
      return NextResponse.json({ error: 'Request timed out after 55 seconds' }, { status: 504 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
