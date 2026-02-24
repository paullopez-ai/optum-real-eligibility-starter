import type { EligibilityScenario } from './patient.types'
import type { EligibilityResponse } from './optum.types'

export interface ClaudeEligibilityInput {
  patient: {
    firstName: string
    lastName: string
    insurancePlan: string
    scenario: EligibilityScenario
  }
  eligibilityResponse: EligibilityResponse
  requestedServiceType: string
}

export interface ClaudeEligibilityAnnotation {
  coverageStatusSummary: string
  patientResponsibility: {
    deductibleRemaining: string
    copay: string
    coinsurance: string
    outOfPocketMax: string
    plainEnglishSummary: string
  }
  fieldAnnotations: Array<{
    fieldName: string
    fieldValue: string
    plainEnglishLabel: string
    explanation: string
    importance: 'HIGH' | 'MEDIUM' | 'LOW'
  }>
  actionItems: Array<{
    priority: 1 | 2 | 3
    action: string
    reason: string
  }>
  riskFlag: {
    hasRisk: boolean
    riskLevel: 'HIGH' | 'MEDIUM' | 'NONE'
    riskSummary: string | null
    specificReason: string | null
  }
  sandboxNote: string
}
