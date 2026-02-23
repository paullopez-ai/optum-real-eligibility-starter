import type { EligibilityRequest, EligibilityResponse, BenefitInformation, PlanStatus, PlanDateInformation } from '@/types/optum.types'
import type { SyntheticPatient, EligibilityScenario } from '@/types/patient.types'
import { getOptumToken } from './optum-auth'

function isDevelopmentMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development' && !process.env.OPTUM_CLIENT_ID
}

function buildEligibilityRequest(patient: SyntheticPatient): EligibilityRequest {
  const today = new Date().toISOString().split('T')[0]
  return {
    controlNumber: `EE${Date.now()}`,
    tradingPartnerServiceId: patient.tradingPartnerServiceId,
    provider: {
      organizationName: 'Skygile Health Partners',
      npi: patient.npi,
    },
    subscriber: {
      memberId: patient.memberId,
      firstName: patient.subscriberFirstName,
      lastName: patient.subscriberLastName,
      dateOfBirth: patient.subscriberDob,
      groupNumber: patient.groupNumber,
    },
    encounter: {
      serviceTypeCodes: [patient.serviceTypeCode],
      dateRange: {
        startDate: today,
        endDate: today,
      },
    },
  }
}

export async function checkEligibility(patient: SyntheticPatient): Promise<EligibilityResponse> {
  if (isDevelopmentMode()) {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
    return getMockResponse(patient)
  }

  const token = await getOptumToken()
  const request = buildEligibilityRequest(patient)
  const eligibilityUrl = process.env.OPTUM_ELIGIBILITY_URL

  if (!eligibilityUrl) {
    throw new Error('Missing OPTUM_ELIGIBILITY_URL')
  }

  const response = await fetch(eligibilityUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Eligibility check failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

function makeBaseResponse(patient: SyntheticPatient): Omit<EligibilityResponse, 'planStatus' | 'benefitInformation' | 'planDateInformation'> {
  return {
    controlNumber: `271-${Date.now()}`,
    tradingPartnerServiceId: patient.tradingPartnerServiceId,
    provider: {
      providerName: 'SKYGILE HEALTH PARTNERS',
      npi: patient.npi,
      serviceProviderNumber: 'SHP00142',
    },
    subscriber: {
      memberId: patient.memberId,
      firstName: patient.subscriberFirstName,
      lastName: patient.subscriberLastName,
      dateOfBirth: patient.subscriberDob,
      groupNumber: patient.groupNumber,
      groupName: patient.insurancePlan.replace('UHC ', 'UNITED HEALTHCARE '),
      address: {
        address1: '1234 Healthcare Way',
        city: 'Minneapolis',
        state: 'MN',
        zip: '55401',
      },
    },
    payer: {
      payerName: 'UNITEDHEALTHCARE',
      payerIdentification: '87726',
      entityIdentifier: 'PAYER',
    },
    planInformation: {
      planNumber: patient.groupNumber,
      groupNumber: patient.groupNumber,
      groupName: patient.insurancePlan.replace('UHC ', 'UNITED HEALTHCARE '),
      planName: patient.insurancePlan,
      insuranceTypeCode: 'QM',
      insuranceType: 'Health Maintenance Organization',
      coverageLevelCode: 'IND',
      coverageLevel: 'Individual',
    },
  }
}

function makeBenefit(overrides: Partial<BenefitInformation>): BenefitInformation {
  return {
    code: overrides.code ?? 'C',
    name: overrides.name ?? 'Deductible',
    coverageLevelCode: overrides.coverageLevelCode ?? 'IND',
    coverageLevel: overrides.coverageLevel ?? 'Individual',
    serviceTypeCodes: overrides.serviceTypeCodes ?? ['30'],
    serviceTypes: overrides.serviceTypes ?? ['Health Benefit Plan Coverage'],
    timeQualifierCode: overrides.timeQualifierCode ?? '23',
    timeQualifier: overrides.timeQualifier ?? 'Calendar Year',
    benefitAmount: overrides.benefitAmount ?? '',
    benefitPercent: overrides.benefitPercent ?? '',
    quantityQualifierCode: overrides.quantityQualifierCode ?? '',
    quantityQualifier: overrides.quantityQualifier ?? '',
    quantity: overrides.quantity ?? '',
    inPlanNetworkIndicatorCode: overrides.inPlanNetworkIndicatorCode ?? 'Y',
    inPlanNetworkIndicator: overrides.inPlanNetworkIndicator ?? 'In Plan-Network',
    authOrCertIndicator: overrides.authOrCertIndicator ?? '',
    additionalInformation: overrides.additionalInformation ?? [],
  }
}

function getMockResponse(patient: SyntheticPatient): EligibilityResponse {
  const scenarioMocks: Record<EligibilityScenario, () => EligibilityResponse> = {
    ELIGIBLE_ACTIVE: () => ({
      ...makeBaseResponse(patient),
      planInformation: {
        ...makeBaseResponse(patient).planInformation,
        insuranceTypeCode: 'QM',
        insuranceType: 'Preferred Provider Organization',
        planName: 'UHC Gold PPO 2024',
      },
      planStatus: [
        { statusCode: '1', status: 'Active Coverage', planDetails: 'Coverage is currently active and in good standing.', serviceTypeCodes: ['30'] },
      ],
      benefitInformation: [
        makeBenefit({ code: 'C', name: 'Deductible', benefitAmount: '1500.00', additionalInformation: ['INDIVIDUAL IN-NETWORK DEDUCTIBLE'] }),
        makeBenefit({ code: 'C', name: 'Deductible - Remaining', benefitAmount: '850.00', additionalInformation: ['INDIVIDUAL IN-NETWORK DEDUCTIBLE REMAINING'] }),
        makeBenefit({ code: 'A', name: 'Co-Payment', benefitAmount: '30.00', serviceTypes: ['Primary Care Visit'], additionalInformation: ['PCP OFFICE VISIT COPAY'] }),
        makeBenefit({ code: 'A', name: 'Co-Insurance', benefitPercent: '20', additionalInformation: ['MEMBER COINSURANCE AFTER DEDUCTIBLE'] }),
        makeBenefit({ code: 'G', name: 'Out of Pocket Maximum', benefitAmount: '6500.00', additionalInformation: ['INDIVIDUAL IN-NETWORK OOP MAXIMUM'] }),
        makeBenefit({ code: 'G', name: 'Out of Pocket - Remaining', benefitAmount: '5150.00', additionalInformation: ['INDIVIDUAL IN-NETWORK OOP REMAINING'] }),
        makeBenefit({ code: 'F', name: 'Preventive Care', benefitAmount: '0.00', benefitPercent: '0', additionalInformation: ['PREVENTIVE SERVICES COVERED 100% IN-NETWORK'] }),
        makeBenefit({ code: 'A', name: 'Specialist Co-Payment', benefitAmount: '50.00', serviceTypes: ['Specialist Visit'], additionalInformation: ['SPECIALIST OFFICE VISIT COPAY'] }),
        makeBenefit({ code: 'C', name: 'Family Deductible', benefitAmount: '3000.00', coverageLevelCode: 'FAM', coverageLevel: 'Family', additionalInformation: ['FAMILY IN-NETWORK DEDUCTIBLE'] }),
        makeBenefit({ code: 'B', name: 'Emergency Room', benefitAmount: '250.00', serviceTypes: ['Emergency Services'], additionalInformation: ['ER COPAY - WAIVED IF ADMITTED'] }),
        makeBenefit({ code: 'A', name: 'Prescription Drug - Generic', benefitAmount: '10.00', serviceTypes: ['Pharmacy'], additionalInformation: ['GENERIC DRUG COPAY'] }),
        makeBenefit({ code: 'A', name: 'Prescription Drug - Brand', benefitAmount: '35.00', serviceTypes: ['Pharmacy'], additionalInformation: ['PREFERRED BRAND DRUG COPAY'] }),
      ],
      planDateInformation: [
        { dateQualifier: '346', dateQualifierLabel: 'Plan Begin', date: '2024-01-01' },
        { dateQualifier: '347', dateQualifierLabel: 'Plan End', date: '2024-12-31' },
        { dateQualifier: '356', dateQualifierLabel: 'Eligibility Begin', date: '2018-06-15' },
      ],
    }),

    ELIGIBLE_DEDUCTIBLE_MET: () => ({
      ...makeBaseResponse(patient),
      planInformation: {
        ...makeBaseResponse(patient).planInformation,
        insuranceTypeCode: 'HN',
        insuranceType: 'Health Maintenance Organization',
        planName: 'UHC Platinum HMO 2024',
      },
      planStatus: [
        { statusCode: '1', status: 'Active Coverage', planDetails: 'Coverage is active. Individual deductible has been satisfied.', serviceTypeCodes: ['30'] },
      ],
      benefitInformation: [
        makeBenefit({ code: 'C', name: 'Deductible', benefitAmount: '2000.00', additionalInformation: ['INDIVIDUAL IN-NETWORK DEDUCTIBLE'] }),
        makeBenefit({ code: 'C', name: 'Deductible - Remaining', benefitAmount: '0.00', additionalInformation: ['INDIVIDUAL DEDUCTIBLE MET'] }),
        makeBenefit({ code: 'A', name: 'Co-Payment', benefitAmount: '20.00', serviceTypes: ['Primary Care Visit'], additionalInformation: ['PCP OFFICE VISIT COPAY'] }),
        makeBenefit({ code: 'A', name: 'Co-Insurance', benefitPercent: '10', additionalInformation: ['MEMBER COINSURANCE AFTER DEDUCTIBLE'] }),
        makeBenefit({ code: 'G', name: 'Out of Pocket Maximum', benefitAmount: '4000.00', additionalInformation: ['INDIVIDUAL IN-NETWORK OOP MAXIMUM'] }),
        makeBenefit({ code: 'G', name: 'Out of Pocket - Remaining', benefitAmount: '1200.00', additionalInformation: ['INDIVIDUAL IN-NETWORK OOP REMAINING'] }),
        makeBenefit({ code: 'F', name: 'Preventive Care', benefitAmount: '0.00', benefitPercent: '0', additionalInformation: ['PREVENTIVE SERVICES COVERED 100%'] }),
        makeBenefit({ code: 'A', name: 'Specialist Co-Payment', benefitAmount: '35.00', serviceTypes: ['Specialist Visit'], additionalInformation: ['SPECIALIST VISIT COPAY'] }),
        makeBenefit({ code: 'A', name: 'Physical Therapy', benefitAmount: '35.00', serviceTypes: ['Physical Therapy'], additionalInformation: ['PT VISIT COPAY - 30 VISITS PER YEAR'], quantity: '30', quantityQualifierCode: 'VS', quantityQualifier: 'Visits' }),
        makeBenefit({ code: 'B', name: 'Emergency Room', benefitAmount: '150.00', serviceTypes: ['Emergency Services'], additionalInformation: ['ER COPAY - WAIVED IF ADMITTED'] }),
      ],
      planDateInformation: [
        { dateQualifier: '346', dateQualifierLabel: 'Plan Begin', date: '2024-01-01' },
        { dateQualifier: '347', dateQualifierLabel: 'Plan End', date: '2024-12-31' },
        { dateQualifier: '356', dateQualifierLabel: 'Eligibility Begin', date: '2019-03-01' },
      ],
    }),

    ELIGIBLE_HIGH_COPAY: () => ({
      ...makeBaseResponse(patient),
      planInformation: {
        ...makeBaseResponse(patient).planInformation,
        insuranceTypeCode: 'QM',
        insuranceType: 'High Deductible Health Plan',
        planName: 'UHC Bronze HSA 2024',
      },
      planStatus: [
        { statusCode: '1', status: 'Active Coverage', planDetails: 'Active HDHP coverage with HSA eligibility. High deductible applies to most services.', serviceTypeCodes: ['30'] },
      ],
      benefitInformation: [
        makeBenefit({ code: 'C', name: 'Deductible', benefitAmount: '3000.00', additionalInformation: ['INDIVIDUAL IN-NETWORK DEDUCTIBLE - HDHP'] }),
        makeBenefit({ code: 'C', name: 'Deductible - Remaining', benefitAmount: '2800.00', additionalInformation: ['INDIVIDUAL DEDUCTIBLE REMAINING'] }),
        makeBenefit({ code: 'A', name: 'Co-Insurance', benefitPercent: '30', additionalInformation: ['MEMBER COINSURANCE AFTER DEDUCTIBLE'] }),
        makeBenefit({ code: 'G', name: 'Out of Pocket Maximum', benefitAmount: '7500.00', additionalInformation: ['INDIVIDUAL IN-NETWORK OOP MAXIMUM'] }),
        makeBenefit({ code: 'G', name: 'Out of Pocket - Remaining', benefitAmount: '7300.00', additionalInformation: ['INDIVIDUAL IN-NETWORK OOP REMAINING'] }),
        makeBenefit({ code: 'F', name: 'Preventive Care', benefitAmount: '0.00', benefitPercent: '0', additionalInformation: ['PREVENTIVE SERVICES COVERED 100% - NO DEDUCTIBLE'] }),
        makeBenefit({ code: 'A', name: 'Primary Care Visit', benefitAmount: '0.00', serviceTypes: ['Primary Care Visit'], additionalInformation: ['SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE'] }),
        makeBenefit({ code: 'A', name: 'Laboratory Services', benefitAmount: '0.00', serviceTypes: ['Laboratory'], additionalInformation: ['SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE'] }),
        makeBenefit({ code: 'A', name: 'Specialist Visit', benefitAmount: '0.00', serviceTypes: ['Specialist Visit'], additionalInformation: ['SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE'] }),
        makeBenefit({ code: 'B', name: 'Emergency Room', benefitAmount: '0.00', serviceTypes: ['Emergency Services'], additionalInformation: ['SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE'] }),
        makeBenefit({ code: 'A', name: 'Prescription Drug - Generic', benefitAmount: '0.00', serviceTypes: ['Pharmacy'], additionalInformation: ['SUBJECT TO DEDUCTIBLE - THEN $15 COPAY'] }),
        makeBenefit({ code: 'A', name: 'HSA Contribution', benefitAmount: '600.00', additionalInformation: ['EMPLOYER HSA CONTRIBUTION - ANNUAL'] }),
      ],
      planDateInformation: [
        { dateQualifier: '346', dateQualifierLabel: 'Plan Begin', date: '2024-01-01' },
        { dateQualifier: '347', dateQualifierLabel: 'Plan End', date: '2024-12-31' },
        { dateQualifier: '356', dateQualifierLabel: 'Eligibility Begin', date: '2023-11-01' },
      ],
    }),

    INELIGIBLE_TERMED: () => ({
      ...makeBaseResponse(patient),
      planInformation: {
        ...makeBaseResponse(patient).planInformation,
        insuranceTypeCode: 'QM',
        insuranceType: 'Preferred Provider Organization',
        planName: 'UHC Choice Plus PPO 2024',
      },
      planStatus: [
        { statusCode: '6', status: 'Inactive', planDetails: 'Coverage terminated. COBRA election period has expired.', serviceTypeCodes: ['30'] },
      ],
      benefitInformation: [
        makeBenefit({ code: 'I', name: 'Non-Covered', benefitAmount: '0.00', additionalInformation: ['COVERAGE TERMINATED - NO ACTIVE BENEFITS'] }),
        makeBenefit({ code: 'R', name: 'Termination Reason', benefitAmount: '0.00', additionalInformation: ['VOLUNTARY WITHDRAWAL - COBRA EXPIRATION'] }),
      ],
      planDateInformation: [
        { dateQualifier: '346', dateQualifierLabel: 'Plan Begin', date: '2024-01-01' },
        { dateQualifier: '347', dateQualifierLabel: 'Plan End', date: '2024-12-31' },
        { dateQualifier: '356', dateQualifierLabel: 'Eligibility Begin', date: '2015-09-01' },
        { dateQualifier: '357', dateQualifierLabel: 'Eligibility End', date: '2024-10-15' },
      ],
    }),

    INELIGIBLE_NOT_FOUND: () => ({
      controlNumber: `271-${Date.now()}`,
      tradingPartnerServiceId: patient.tradingPartnerServiceId,
      provider: {
        providerName: 'SKYGILE HEALTH PARTNERS',
        npi: patient.npi,
        serviceProviderNumber: 'SHP00142',
      },
      subscriber: {
        memberId: patient.memberId,
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        groupNumber: '',
        groupName: '',
        address: { address1: '', city: '', state: '', zip: '' },
      },
      payer: {
        payerName: 'UNITEDHEALTHCARE',
        payerIdentification: '87726',
        entityIdentifier: 'PAYER',
      },
      planInformation: {
        planNumber: '',
        groupNumber: '',
        groupName: '',
        planName: '',
        insuranceTypeCode: '',
        insuranceType: '',
        coverageLevelCode: '',
        coverageLevel: '',
      },
      planStatus: [
        { statusCode: '0', status: 'Not Found', planDetails: 'No matching subscriber record found for the provided member ID.', serviceTypeCodes: ['30'] },
      ],
      benefitInformation: [
        makeBenefit({ code: 'U', name: 'Contact Payer', benefitAmount: '0.00', additionalInformation: ['UNABLE TO LOCATE MEMBER - VERIFY MEMBER ID AND RESUBMIT'] }),
      ],
      planDateInformation: [],
    }),

    ELIGIBLE_PENDING: () => ({
      ...makeBaseResponse(patient),
      planInformation: {
        ...makeBaseResponse(patient).planInformation,
        insuranceTypeCode: 'MA',
        insuranceType: 'Medicare Advantage',
        planName: 'UHC Medicare Advantage PPO',
      },
      planStatus: [
        { statusCode: '1', status: 'Active Coverage', planDetails: 'Enrollment confirmed. Coverage effective date is pending. Benefits listed are subject to effective date.', serviceTypeCodes: ['30'] },
      ],
      benefitInformation: [
        makeBenefit({ code: 'C', name: 'Deductible', benefitAmount: '250.00', additionalInformation: ['PART B DEDUCTIBLE - PENDING EFFECTIVE DATE'] }),
        makeBenefit({ code: 'A', name: 'Co-Payment', benefitAmount: '0.00', serviceTypes: ['Primary Care Visit'], additionalInformation: ['$0 PCP COPAY - PENDING EFFECTIVE DATE'] }),
        makeBenefit({ code: 'A', name: 'Co-Insurance', benefitPercent: '20', additionalInformation: ['MEMBER COINSURANCE - PENDING EFFECTIVE DATE'] }),
        makeBenefit({ code: 'G', name: 'Out of Pocket Maximum', benefitAmount: '3900.00', additionalInformation: ['IN-NETWORK OOP MAXIMUM - PENDING EFFECTIVE DATE'] }),
        makeBenefit({ code: 'F', name: 'Preventive Care', benefitAmount: '0.00', benefitPercent: '0', additionalInformation: ['ANNUAL WELLNESS VISIT COVERED 100% - PENDING'] }),
        makeBenefit({ code: 'A', name: 'Specialist Co-Payment', benefitAmount: '40.00', serviceTypes: ['Specialist Visit'], additionalInformation: ['SPECIALIST COPAY - PENDING EFFECTIVE DATE'] }),
        makeBenefit({ code: 'A', name: 'Prescription Drug - Generic', benefitAmount: '5.00', serviceTypes: ['Pharmacy'], additionalInformation: ['TIER 1 DRUG COPAY - PENDING EFFECTIVE DATE'] }),
        makeBenefit({ code: 'A', name: 'Vision Services', benefitAmount: '0.00', serviceTypes: ['Vision'], additionalInformation: ['ROUTINE EYE EXAM COVERED - PENDING EFFECTIVE DATE'] }),
      ],
      planDateInformation: [
        { dateQualifier: '346', dateQualifierLabel: 'Plan Begin', date: '2025-01-01' },
        { dateQualifier: '347', dateQualifierLabel: 'Plan End', date: '2025-12-31' },
        { dateQualifier: '356', dateQualifierLabel: 'Eligibility Begin', date: '2025-01-01' },
      ],
    }),
  }

  return scenarioMocks[patient.scenario]()
}
