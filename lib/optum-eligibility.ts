import type { EligibilityResponse, EligibilityInput, GraphQLEligibilityResponse } from '@/types/optum.types'
import type { SyntheticPatient, EligibilityScenario } from '@/types/patient.types'
import { getOptumToken } from './optum-auth'

function isDevelopmentMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development' && !process.env.OPTUM_CLIENT_ID
}

const ELIGIBILITY_QUERY = `query CheckEligibility($input: EligibilityInput!) {
  checkEligibility(input: $input) {
    eligibility {
      eligibilityInfo {
        trnId
        member {
          memberId
          firstName
          lastName
          middleName
          suffix
          dateOfBirth
          gender
          relationshipCode
          dependentSequenceNumber
          individualRelationship { code description }
          relationshipType { code description }
        }
        contact {
          addresses { type street1 street2 city state country zip zip4 }
        }
        insuranceInfo {
          policyNumber
          eligibilityStartDate
          eligibilityEndDate
          planStartDate
          planEndDate
          policyStatus
          planTypeDescription
          groupName
          address { type street1 street2 city state country zip zip4 }
          stateOfIssueCode
          productType
          productId
          productCode
          payerId
          lineOfBusinessCode
          governmentProgramCode
          coverageType
          insuranceTypeCode
          insuranceType
        }
        associatedIds {
          alternateId medicaidRecipientId exchangeMemberId
          alternateSubscriberId hicNumber mbiNumber
          subscriberMemberFacingIdentifier survivingSpouseId
          subscriberId memberReplacementId legacyMemberId
          healthInsuranceExchangeId
        }
        planLevels {
          level
          family { networkStatus planAmount planAmountFrequency remainingAmount }
          individual { networkStatus planAmount planAmountFrequency remainingAmount }
        }
        delegatedInfo {
          entity payerId
          contact { phone fax email }
          addresses { type street1 street2 city state country zip zip4 }
        }
      }
      primaryCarePhysician {
        lastName firstName middleName phoneNumber
        address { type street1 street2 city state country zip zip4 }
        affiliateHospitalName providerGroupName pcpSpeciality
        pcpStartDate pcpEndDate providerNPI providerTIN
        acoNetworkDescription acoNetworkId
      }
      providerNetwork { status tier speciality }
      serviceLevels {
        vendorServices { key vendorName url phone serviceDescription serviceTypeCode }
        family {
          networkStatus
          services {
            service serviceCode serviceDate status
            planAmount remainingAmount metYearToDateAmount
            message {
              coPay {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay frequency msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              coInsurance {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              deductible {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              benefitsAllowed {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              benefitsRemaining {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              coPayList { placeOfService copay service startDate endDate messages }
              coInsuranceList { placeOfService coinsurancePercent service messages startDate endDate }
            }
          }
        }
        individual {
          networkStatus
          services {
            service serviceCode serviceDate status
            planAmount remainingAmount metYearToDateAmount
            message {
              coPay {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay frequency msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              coInsurance {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              deductible {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              benefitsAllowed {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              benefitsRemaining {
                isSingleMessageDetail isViewDetail messages
                subMessages { service status copay msg startDate endDate minCopay minCopayMsg maxCopay maxCopayMsg isPrimaryIndicator }
                limitationInfo { lmtPeriod lmtType lmtOccurPerPeriod lmtDollarPerPeriod message messages }
                isMultipleCopaysFound isMultipleCoinsuranceFound
              }
              coPayList { placeOfService copay service startDate endDate messages }
              coInsuranceList { placeOfService coinsurancePercent service messages startDate endDate }
            }
          }
        }
      }
      additionalInfo {
        fundingType fundingArrangementDescription businessSegment
        sizeDefinitionDescription revenueArrangementDescription
        hsa cdhp cmsHId cmsPackageBenefitPlanCode cmsSegmentId
        cmsContractId benefitPlanId virtualVisit
        designatedVirtualClinicNetwork medicaidVariableCode
        hraBalance hraMessage hraUnavailableMessage
        graceMessageByState gracePaidThrough gracePeriodMonth
        medicareGuidelines medicareEntitlementReason
      }
    }
  }
}`

function buildEligibilityVariables(patient: SyntheticPatient): { input: EligibilityInput } {
  const today = new Date().toISOString().split('T')[0]
  return {
    input: {
      memberId: patient.memberId,
      firstName: patient.subscriberFirstName,
      lastName: patient.subscriberLastName,
      groupNumber: patient.groupNumber,
      dateOfBirth: patient.subscriberDob.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      serviceStartDate: today,
      serviceEndDate: today,
      payerId: patient.payerId,
      providerNPI: patient.npi,
      providerFirstName: 'Sample',
      providerLastName: 'Provider',
      serviceLevelCodes: [patient.serviceTypeCode],
    },
  }
}

export async function checkEligibility(patient: SyntheticPatient): Promise<EligibilityResponse> {
  if (isDevelopmentMode()) {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
    return getMockResponse(patient)
  }

  const token = await getOptumToken()
  const eligibilityUrl = process.env.OPTUM_ELIGIBILITY_URL
  const providerTaxId = process.env.OPTUM_PROVIDER_TAX_ID

  if (!eligibilityUrl) {
    throw new Error('Missing OPTUM_ELIGIBILITY_URL')
  }

  const variables = buildEligibilityVariables(patient)

  const response = await fetch(eligibilityUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(providerTaxId ? { 'providerTaxId': providerTaxId } : {}),
      'x-optum-consumer-correlation-id': `eligibility-starter-${Date.now()}`,
      'environment': 'sandbox',
    },
    body: JSON.stringify({
      query: ELIGIBILITY_QUERY,
      variables,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Eligibility API error response:', errorBody)
    throw new Error(`Eligibility check failed: ${response.status} ${response.statusText} — ${errorBody}`)
  }

  const graphqlResponse: GraphQLEligibilityResponse = await response.json()
  const eligibility = graphqlResponse.data?.checkEligibility?.eligibility

  if (!eligibility || eligibility.length === 0) {
    throw new Error('No eligibility records returned from GraphQL API')
  }

  return eligibility[0]
}

// --- Mock data helpers ---

function emptyMessageDetail() {
  return {
    isSingleMessageDetail: false,
    isViewDetail: false,
    messages: [] as string[],
    subMessages: [],
    limitationInfo: [],
    isMultipleCopaysFound: null,
    isMultipleCoinsuranceFound: null,
  }
}

function emptyServiceMessage() {
  return {
    coPay: emptyMessageDetail(),
    coInsurance: emptyMessageDetail(),
    deductible: emptyMessageDetail(),
    benefitsAllowed: emptyMessageDetail(),
    benefitsRemaining: emptyMessageDetail(),
    coPayList: [],
    coInsuranceList: [],
  }
}

function makeBaseEligibilityInfo(patient: SyntheticPatient, overrides: {
  policyStatus: string
  eligibilityStartDate: string
  eligibilityEndDate: string
  planStartDate: string
  planEndDate: string
  productType: string
  insuranceTypeCode: string
  insuranceType: string
  planLevels?: EligibilityResponse['eligibilityInfo']['planLevels']
}) {
  return {
    trnId: null,
    member: {
      memberId: patient.memberId,
      firstName: patient.subscriberFirstName,
      lastName: patient.subscriberLastName,
      middleName: '',
      suffix: '',
      dateOfBirth: patient.subscriberDob.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      gender: 'U',
      relationshipCode: '000',
      dependentSequenceNumber: '00',
      individualRelationship: { code: 'EE', description: 'subscriber' },
      relationshipType: { code: '18', description: 'Self' },
    },
    contact: {
      addresses: [{
        type: 'Postal/Mailing',
        street1: '1234 Healthcare Way',
        street2: '',
        city: 'Minneapolis',
        state: 'MN',
        country: 'US',
        zip: '55401',
        zip4: '',
      }],
    },
    insuranceInfo: {
      policyNumber: patient.groupNumber,
      eligibilityStartDate: overrides.eligibilityStartDate,
      eligibilityEndDate: overrides.eligibilityEndDate,
      planStartDate: overrides.planStartDate,
      planEndDate: overrides.planEndDate,
      policyStatus: overrides.policyStatus,
      planTypeDescription: overrides.insuranceType,
      groupName: patient.insurancePlan.replace('UHC ', 'UNITED HEALTHCARE '),
      address: {
        type: 'Claim',
        street1: '1234 Healthcare Way',
        street2: '',
        city: 'Minneapolis',
        state: 'MN',
        country: 'US',
        zip: '55401',
        zip4: '',
      },
      stateOfIssueCode: 'MN',
      productType: overrides.productType,
      productId: '',
      productCode: '9',
      payerId: '87726',
      lineOfBusinessCode: 'E&I',
      governmentProgramCode: '',
      coverageType: 'Medical',
      insuranceTypeCode: overrides.insuranceTypeCode,
      insuranceType: overrides.insuranceType,
    },
    associatedIds: {
      alternateId: patient.memberId,
      medicaidRecipientId: '',
      exchangeMemberId: '',
      alternateSubscriberId: '',
      hicNumber: '',
      mbiNumber: '',
      subscriberMemberFacingIdentifier: '',
      survivingSpouseId: '',
      subscriberId: patient.memberId,
      memberReplacementId: '',
      legacyMemberId: '',
      healthInsuranceExchangeId: '',
    },
    planLevels: overrides.planLevels ?? [],
    delegatedInfo: [],
  }
}

function makeBasePCP(patient: SyntheticPatient) {
  const parts = patient.primaryCareProvider.replace(/^Dr\.\s*/, '').split(/,?\s+/)
  return {
    lastName: parts.length > 1 ? parts.slice(1).join(' ').replace(/,?\s*(MD|DO)$/, '') : '',
    firstName: parts[0] ?? '',
    middleName: '',
    phoneNumber: '800-555-0100',
    address: {
      type: 'Postal/Mailing',
      street1: '456 Medical Plaza',
      street2: 'Suite 200',
      city: 'Minneapolis',
      state: 'MN',
      country: 'US',
      zip: '55402',
      zip4: '',
    },
    affiliateHospitalName: 'SAMPLE HEALTH PARTNERS HOSPITAL',
    providerGroupName: 'SAMPLE HEALTH PARTNERS',
    pcpSpeciality: 'Family Medicine',
    pcpStartDate: '2023-01-01',
    pcpEndDate: '2025-12-31',
    providerNPI: patient.npi,
    providerTIN: '448835440',
    acoNetworkDescription: 'MINNESOTA',
    acoNetworkId: '100001',
  }
}

function makeIndividualServiceLevel(services: Array<{
  service: string
  serviceCode: string
  status: string
  copayMessages?: string[]
  copayAmount?: string
  coinsuranceMessages?: string[]
  deductibleMessages?: string[]
}>) {
  return {
    vendorServices: [],
    family: [],
    individual: [{
      networkStatus: 'inNetwork',
      services: services.map(s => ({
        service: s.service,
        serviceCode: s.serviceCode,
        serviceDate: '',
        status: s.status,
        planAmount: '',
        remainingAmount: '',
        metYearToDateAmount: '',
        message: {
          ...emptyServiceMessage(),
          coPay: {
            ...emptyMessageDetail(),
            messages: s.copayMessages ?? [],
            subMessages: s.copayAmount ? [{
              service: s.service,
              status: s.status,
              copay: s.copayAmount,
              frequency: null,
              msg: '',
              startDate: null,
              endDate: null,
              minCopay: '',
              minCopayMsg: '',
              maxCopay: '',
              maxCopayMsg: '',
              isPrimaryIndicator: false,
            }] : [],
          },
          coInsurance: {
            ...emptyMessageDetail(),
            messages: s.coinsuranceMessages ?? [],
          },
          deductible: {
            ...emptyMessageDetail(),
            messages: s.deductibleMessages ?? [],
          },
        },
      })),
    }],
  }
}

function getMockResponse(patient: SyntheticPatient): EligibilityResponse {
  const scenarioMocks: Record<EligibilityScenario, () => EligibilityResponse> = {
    ELIGIBLE_ACTIVE: () => ({
      eligibilityInfo: makeBaseEligibilityInfo(patient, {
        policyStatus: 'Active Policy',
        eligibilityStartDate: '2018-06-15',
        eligibilityEndDate: '2024-12-31',
        planStartDate: '2024-01-01',
        planEndDate: '2024-12-31',
        productType: 'PPO',
        insuranceTypeCode: 'QM',
        insuranceType: 'Preferred Provider Organization (PPO)',
        planLevels: [
          {
            level: 'deductibleInfo',
            family: [{ networkStatus: 'InNetwork', planAmount: '3000.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '1700.00' }],
            individual: [{ networkStatus: 'InNetwork', planAmount: '1500.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '850.00' }],
          },
          {
            level: 'outOfPocketInfo',
            family: [{ networkStatus: 'InNetwork', planAmount: '13000.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '10300.00' }],
            individual: [{ networkStatus: 'InNetwork', planAmount: '6500.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '5150.00' }],
          },
        ],
      }),
      primaryCarePhysician: makeBasePCP(patient),
      providerNetwork: { status: 'In Network', tier: '1', speciality: 'Family Medicine' },
      serviceLevels: [makeIndividualServiceLevel([
        { service: 'Health Benefit Plan Coverage', serviceCode: '30', status: 'Active', copayMessages: ['$30 / Visit PCP OFFICE VISIT COPAY'], copayAmount: '$30', coinsuranceMessages: ['20% MEMBER COINSURANCE AFTER DEDUCTIBLE'] },
        { service: 'Specialist Visit', serviceCode: '98', status: 'Active', copayMessages: ['$50 / Visit SPECIALIST OFFICE VISIT COPAY'], copayAmount: '$50' },
        { service: 'Emergency Services', serviceCode: '86', status: 'Active', copayMessages: ['$250 / Visit ER COPAY - WAIVED IF ADMITTED'], copayAmount: '$250' },
        { service: 'Pharmacy', serviceCode: '88', status: 'Active', copayMessages: ['$10 GENERIC / $35 PREFERRED BRAND'], copayAmount: '$10' },
        { service: 'Preventive Care', serviceCode: '35', status: 'Active', copayMessages: ['$0 / Visit PREVENTIVE SERVICES COVERED 100% IN-NETWORK'], copayAmount: '$0' },
      ])],
      additionalInfo: { fundingType: 'Fully Insured', fundingArrangementDescription: 'Fully Insured', businessSegment: 'E&I', sizeDefinitionDescription: 'Large Group', revenueArrangementDescription: '', hsa: 'N', cdhp: 'N', cmsHId: '', cmsPackageBenefitPlanCode: '', cmsSegmentId: '', cmsContractId: '', benefitPlanId: '', virtualVisit: 'Y', designatedVirtualClinicNetwork: '', medicaidVariableCode: '', hraBalance: '', hraMessage: '', hraUnavailableMessage: '', graceMessageByState: '', gracePaidThrough: '', gracePeriodMonth: '', medicareGuidelines: '', medicareEntitlementReason: '' },
    }),

    ELIGIBLE_DEDUCTIBLE_MET: () => ({
      eligibilityInfo: makeBaseEligibilityInfo(patient, {
        policyStatus: 'Active Policy',
        eligibilityStartDate: '2019-03-01',
        eligibilityEndDate: '2024-12-31',
        planStartDate: '2024-01-01',
        planEndDate: '2024-12-31',
        productType: 'HMO',
        insuranceTypeCode: 'HN',
        insuranceType: 'Health Maintenance Organization (HMO)',
        planLevels: [
          {
            level: 'deductibleInfo',
            family: [{ networkStatus: 'InNetwork', planAmount: '4000.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '0.00' }],
            individual: [{ networkStatus: 'InNetwork', planAmount: '2000.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '0.00' }],
          },
          {
            level: 'outOfPocketInfo',
            family: [{ networkStatus: 'InNetwork', planAmount: '8000.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '2400.00' }],
            individual: [{ networkStatus: 'InNetwork', planAmount: '4000.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '1200.00' }],
          },
        ],
      }),
      primaryCarePhysician: makeBasePCP(patient),
      providerNetwork: { status: 'In Network', tier: '1', speciality: 'Internal Medicine' },
      serviceLevels: [makeIndividualServiceLevel([
        { service: 'Health Benefit Plan Coverage', serviceCode: '30', status: 'Active', copayMessages: ['$20 / Visit PCP OFFICE VISIT COPAY'], copayAmount: '$20', coinsuranceMessages: ['10% MEMBER COINSURANCE AFTER DEDUCTIBLE'] },
        { service: 'Specialist Visit', serviceCode: '98', status: 'Active', copayMessages: ['$35 / Visit SPECIALIST VISIT COPAY'], copayAmount: '$35' },
        { service: 'Physical Therapy', serviceCode: '91', status: 'Active', copayMessages: ['$35 / Visit PT VISIT COPAY - 30 VISITS PER YEAR'], copayAmount: '$35' },
        { service: 'Emergency Services', serviceCode: '86', status: 'Active', copayMessages: ['$150 / Visit ER COPAY - WAIVED IF ADMITTED'], copayAmount: '$150' },
        { service: 'Preventive Care', serviceCode: '35', status: 'Active', copayMessages: ['$0 / Visit PREVENTIVE SERVICES COVERED 100%'], copayAmount: '$0' },
      ])],
      additionalInfo: { fundingType: 'Fully Insured', fundingArrangementDescription: 'Fully Insured', businessSegment: 'E&I', sizeDefinitionDescription: 'Large Group', revenueArrangementDescription: '', hsa: 'N', cdhp: 'N', cmsHId: '', cmsPackageBenefitPlanCode: '', cmsSegmentId: '', cmsContractId: '', benefitPlanId: '', virtualVisit: 'Y', designatedVirtualClinicNetwork: '', medicaidVariableCode: '', hraBalance: '', hraMessage: '', hraUnavailableMessage: '', graceMessageByState: '', gracePaidThrough: '', gracePeriodMonth: '', medicareGuidelines: '', medicareEntitlementReason: '' },
    }),

    ELIGIBLE_HIGH_COPAY: () => ({
      eligibilityInfo: makeBaseEligibilityInfo(patient, {
        policyStatus: 'Active Policy',
        eligibilityStartDate: '2023-11-01',
        eligibilityEndDate: '2024-12-31',
        planStartDate: '2024-01-01',
        planEndDate: '2024-12-31',
        productType: 'EPO',
        insuranceTypeCode: 'QM',
        insuranceType: 'High Deductible Health Plan (HDHP)',
        planLevels: [
          {
            level: 'deductibleInfo',
            family: [{ networkStatus: 'InNetwork', planAmount: '6000.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '5600.00' }],
            individual: [{ networkStatus: 'InNetwork', planAmount: '3000.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '2800.00' }],
          },
          {
            level: 'outOfPocketInfo',
            family: [{ networkStatus: 'InNetwork', planAmount: '15000.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '14600.00' }],
            individual: [{ networkStatus: 'InNetwork', planAmount: '7500.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '7300.00' }],
          },
        ],
      }),
      primaryCarePhysician: makeBasePCP(patient),
      providerNetwork: { status: 'In Network', tier: '1', speciality: 'Family Medicine' },
      serviceLevels: [makeIndividualServiceLevel([
        { service: 'Health Benefit Plan Coverage', serviceCode: '30', status: 'Active', copayMessages: ['SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE'], coinsuranceMessages: ['30% MEMBER COINSURANCE AFTER DEDUCTIBLE'], deductibleMessages: ['$3,000 INDIVIDUAL IN-NETWORK DEDUCTIBLE - HDHP'] },
        { service: 'Specialist Visit', serviceCode: '98', status: 'Active', copayMessages: ['SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE'] },
        { service: 'Laboratory Services', serviceCode: '5', status: 'Active', copayMessages: ['SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE'] },
        { service: 'Emergency Services', serviceCode: '86', status: 'Active', copayMessages: ['SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE'] },
        { service: 'Preventive Care', serviceCode: '35', status: 'Active', copayMessages: ['$0 / Visit PREVENTIVE SERVICES COVERED 100% - NO DEDUCTIBLE'], copayAmount: '$0' },
        { service: 'Pharmacy - Generic', serviceCode: '88', status: 'Active', copayMessages: ['SUBJECT TO DEDUCTIBLE - THEN $15 COPAY'] },
      ])],
      additionalInfo: { fundingType: 'Fully Insured', fundingArrangementDescription: 'Fully Insured', businessSegment: 'E&I', sizeDefinitionDescription: 'Large Group', revenueArrangementDescription: '', hsa: 'Y', cdhp: 'Y', cmsHId: '', cmsPackageBenefitPlanCode: '', cmsSegmentId: '', cmsContractId: '', benefitPlanId: '', virtualVisit: 'Y', designatedVirtualClinicNetwork: '', medicaidVariableCode: '', hraBalance: '', hraMessage: '', hraUnavailableMessage: '', graceMessageByState: '', gracePaidThrough: '', gracePeriodMonth: '', medicareGuidelines: '', medicareEntitlementReason: '' },
    }),

    INELIGIBLE_TERMED: () => ({
      eligibilityInfo: makeBaseEligibilityInfo(patient, {
        policyStatus: 'Past Policy',
        eligibilityStartDate: '2015-09-01',
        eligibilityEndDate: '2024-10-15',
        planStartDate: '2024-01-01',
        planEndDate: '2024-12-31',
        productType: 'PPO',
        insuranceTypeCode: 'QM',
        insuranceType: 'Preferred Provider Organization (PPO)',
        planLevels: [],
      }),
      primaryCarePhysician: null,
      providerNetwork: null,
      serviceLevels: [makeIndividualServiceLevel([
        { service: 'Health Benefit Plan Coverage', serviceCode: '30', status: 'Inactive', copayMessages: ['COVERAGE TERMINATED - NO ACTIVE BENEFITS'] },
      ])],
      additionalInfo: null,
    }),

    INELIGIBLE_NOT_FOUND: () => ({
      eligibilityInfo: {
        trnId: null,
        member: {
          memberId: patient.memberId,
          firstName: '',
          lastName: '',
          middleName: '',
          suffix: '',
          dateOfBirth: '',
          gender: '',
          relationshipCode: '',
          dependentSequenceNumber: '',
          individualRelationship: null,
          relationshipType: null,
        },
        contact: null,
        insuranceInfo: {
          policyNumber: '',
          eligibilityStartDate: '',
          eligibilityEndDate: '',
          planStartDate: '',
          planEndDate: '',
          policyStatus: 'Not Found',
          planTypeDescription: '',
          groupName: '',
          address: null,
          stateOfIssueCode: '',
          productType: '',
          productId: '',
          productCode: '',
          payerId: '87726',
          lineOfBusinessCode: '',
          governmentProgramCode: '',
          coverageType: '',
          insuranceTypeCode: '',
          insuranceType: '',
        },
        associatedIds: null,
        planLevels: [],
        delegatedInfo: [],
      },
      primaryCarePhysician: null,
      providerNetwork: null,
      serviceLevels: [],
      additionalInfo: null,
    }),

    ELIGIBLE_PENDING: () => ({
      eligibilityInfo: makeBaseEligibilityInfo(patient, {
        policyStatus: 'Future Policy',
        eligibilityStartDate: '2025-01-01',
        eligibilityEndDate: '2025-12-31',
        planStartDate: '2025-01-01',
        planEndDate: '2025-12-31',
        productType: 'MA',
        insuranceTypeCode: 'MA',
        insuranceType: 'Medicare Advantage',
        planLevels: [
          {
            level: 'deductibleInfo',
            family: [],
            individual: [{ networkStatus: 'InNetwork', planAmount: '250.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '250.00' }],
          },
          {
            level: 'outOfPocketInfo',
            family: [],
            individual: [{ networkStatus: 'InNetwork', planAmount: '3900.00', planAmountFrequency: '(Calendar Year)', remainingAmount: '3900.00' }],
          },
        ],
      }),
      primaryCarePhysician: makeBasePCP(patient),
      providerNetwork: { status: 'In Network', tier: '1', speciality: 'Family Medicine' },
      serviceLevels: [makeIndividualServiceLevel([
        { service: 'Health Benefit Plan Coverage', serviceCode: '30', status: 'Active', copayMessages: ['$0 PCP COPAY - PENDING EFFECTIVE DATE'], copayAmount: '$0', coinsuranceMessages: ['20% MEMBER COINSURANCE - PENDING EFFECTIVE DATE'] },
        { service: 'Specialist Visit', serviceCode: '98', status: 'Active', copayMessages: ['$40 / Visit SPECIALIST COPAY - PENDING EFFECTIVE DATE'], copayAmount: '$40' },
        { service: 'Pharmacy - Generic', serviceCode: '88', status: 'Active', copayMessages: ['$5 TIER 1 DRUG COPAY - PENDING EFFECTIVE DATE'], copayAmount: '$5' },
        { service: 'Vision Services', serviceCode: '47', status: 'Active', copayMessages: ['$0 ROUTINE EYE EXAM COVERED - PENDING EFFECTIVE DATE'], copayAmount: '$0' },
        { service: 'Preventive Care', serviceCode: '35', status: 'Active', copayMessages: ['$0 / Visit ANNUAL WELLNESS VISIT COVERED 100% - PENDING'], copayAmount: '$0' },
      ])],
      additionalInfo: { fundingType: '', fundingArrangementDescription: '', businessSegment: '', sizeDefinitionDescription: '', revenueArrangementDescription: '', hsa: 'N', cdhp: 'N', cmsHId: '', cmsPackageBenefitPlanCode: '', cmsSegmentId: '', cmsContractId: '', benefitPlanId: '', virtualVisit: 'Y', designatedVirtualClinicNetwork: '', medicaidVariableCode: '', hraBalance: '', hraMessage: '', hraUnavailableMessage: '', graceMessageByState: '', gracePaidThrough: '', gracePeriodMonth: '', medicareGuidelines: 'Medicare guidelines apply', medicareEntitlementReason: 'Age' },
    }),
  }

  return scenarioMocks[patient.scenario]()
}
