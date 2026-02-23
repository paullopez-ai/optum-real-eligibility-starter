import type { EligibilityResponse } from './optum.types'
import type { ClaudeEligibilityAnnotation } from './claude.types'

export type EligibilityScenario =
  | 'ELIGIBLE_ACTIVE'
  | 'ELIGIBLE_DEDUCTIBLE_MET'
  | 'ELIGIBLE_HIGH_COPAY'
  | 'INELIGIBLE_TERMED'
  | 'INELIGIBLE_NOT_FOUND'
  | 'ELIGIBLE_PENDING'

export interface SyntheticPatient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  memberId: string
  groupNumber: string
  tradingPartnerServiceId: string
  insurancePlan: string
  primaryCareProvider: string
  scenario: EligibilityScenario
  scenarioLabel: string
  narrativeContext: string
  subscriberFirstName: string
  subscriberLastName: string
  subscriberDob: string
  npi: string
  serviceTypeCode: string
}

export type AppState =
  | { status: 'idle' }
  | { status: 'selected'; patient: SyntheticPatient }
  | { status: 'loading'; patient: SyntheticPatient; step: 'eligibility' | 'annotation' }
  | { status: 'success'; patient: SyntheticPatient; result: EligibilityResult }
  | { status: 'error'; patient: SyntheticPatient; error: string }
  | { status: 'fallback'; patient: SyntheticPatient; rawResponse: EligibilityResponse }

export interface EligibilityResult {
  rawResponse: EligibilityResponse
  annotation: ClaudeEligibilityAnnotation
  durationMs: { eligibility: number; annotation: number }
}
