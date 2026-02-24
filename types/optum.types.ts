// GraphQL input variables for checkEligibility query
export interface EligibilityInput {
  memberId: string
  firstName: string
  lastName: string
  groupNumber: string
  dateOfBirth: string
  serviceStartDate: string
  serviceEndDate: string
  payerId: string
  providerNPI: string
  serviceLevelCodes: string[]
  providerFirstName: string
  providerLastName: string
  planStartDate?: string
  planEndDate?: string
  familyIndicator?: string
  trnId?: string
}

// The full GraphQL response wrapper
export interface GraphQLEligibilityResponse {
  data: {
    checkEligibility: {
      eligibility: EligibilityRecord[]
    }
  }
}

// A single eligibility record — this is what we pass around as EligibilityResponse
export interface EligibilityResponse {
  eligibilityInfo: EligibilityInfo
  primaryCarePhysician: PrimaryCarePhysician | null
  providerNetwork: ProviderNetwork | null
  serviceLevels: ServiceLevel[]
  additionalInfo: AdditionalInfo | null
}

export interface EligibilityInfo {
  trnId: string | null
  member: MemberInfo
  contact: ContactInfo | null
  insuranceInfo: InsuranceInfo
  associatedIds: AssociatedIds | null
  planLevels: PlanLevel[]
  delegatedInfo: DelegatedInfo[]
}

export interface MemberInfo {
  memberId: string
  firstName: string
  lastName: string
  middleName: string
  suffix: string
  dateOfBirth: string
  gender: string
  relationshipCode: string
  dependentSequenceNumber: string
  individualRelationship: CodeDescription | null
  relationshipType: CodeDescription | null
}

export interface CodeDescription {
  code: string
  description: string
}

export interface ContactInfo {
  addresses: Address[]
}

export interface Address {
  type: string
  street1: string
  street2: string
  city: string
  state: string
  country: string
  zip: string
  zip4: string
}

export interface InsuranceInfo {
  policyNumber: string
  eligibilityStartDate: string
  eligibilityEndDate: string
  planStartDate: string
  planEndDate: string
  policyStatus: string
  planTypeDescription: string
  groupName: string
  address: Address | null
  stateOfIssueCode: string
  productType: string
  productId: string
  productCode: string
  payerId: string
  lineOfBusinessCode: string
  governmentProgramCode: string
  coverageType: string
  insuranceTypeCode: string
  insuranceType: string
  paidThroughDate?: string
  consumerName?: string
}

export interface AssociatedIds {
  alternateId: string
  medicaidRecipientId: string
  exchangeMemberId: string
  alternateSubscriberId: string
  hicNumber: string
  mbiNumber: string
  subscriberMemberFacingIdentifier: string
  survivingSpouseId: string
  subscriberId: string
  memberReplacementId: string
  legacyMemberId: string
  healthInsuranceExchangeId: string
}

export interface PlanLevelAmount {
  networkStatus: string
  planAmount: string
  planAmountFrequency: string
  remainingAmount: string
}

export interface PlanLevel {
  level: string
  family: PlanLevelAmount[]
  individual: PlanLevelAmount[]
}

export interface DelegatedInfo {
  entity: string
  payerId: string
  contact: {
    phone: string
    fax: string
    email: string
  }
  addresses: Address[]
}

export interface PrimaryCarePhysician {
  lastName: string
  firstName: string
  middleName: string
  phoneNumber: string
  address: Address | null
  affiliateHospitalName: string
  providerGroupName: string
  pcpSpeciality: string
  pcpStartDate: string
  pcpEndDate: string
  providerNPI: string
  providerTIN: string
  acoNetworkDescription: string
  acoNetworkId: string
}

export interface ProviderNetwork {
  status: string
  tier: string
  speciality: string
}

export interface ServiceMessageDetail {
  isSingleMessageDetail: boolean
  isViewDetail: boolean
  messages: string[]
  subMessages: ServiceSubMessage[]
  limitationInfo: LimitationInfo[]
  isMultipleCopaysFound: boolean | null
  isMultipleCoinsuranceFound: boolean | null
}

export interface ServiceSubMessage {
  service: string
  status: string
  copay: string
  frequency?: string | null
  msg: string
  startDate: string | null
  endDate: string | null
  minCopay: string
  minCopayMsg: string
  maxCopay: string
  maxCopayMsg: string
  isPrimaryIndicator: boolean
  exactCopay?: {
    coveredStatus: string
    copayDetails: { amount: string; serviceSetting: string }[]
  } | null
}

export interface LimitationInfo {
  lmtPeriod: string
  lmtType: string
  lmtOccurPerPeriod: string
  lmtDollarPerPeriod: string
  message: string
  messages: string[]
}

export interface ServiceMessage {
  coPay: ServiceMessageDetail
  coInsurance: ServiceMessageDetail
  deductible: ServiceMessageDetail
  benefitsAllowed: ServiceMessageDetail
  benefitsRemaining: ServiceMessageDetail
  coPayList: CoPayListItem[]
  coInsuranceList: CoInsuranceListItem[]
}

export interface CoPayListItem {
  placeOfService: string
  copay: string
  service: string
  startDate: string
  endDate: string
  messages: string[]
}

export interface CoInsuranceListItem {
  placeOfService: string
  coinsurancePercent: string
  service: string
  messages: string[]
  startDate: string | null
  endDate: string | null
}

export interface ServiceInfo {
  service: string
  serviceCode: string
  serviceDate: string
  status: string
  planAmount: string
  remainingAmount: string
  metYearToDateAmount: string
  message: ServiceMessage
}

export interface NetworkServiceLevel {
  networkStatus: string
  services: ServiceInfo[]
}

export interface ServiceLevel {
  vendorServices?: VendorService[]
  family: NetworkServiceLevel[]
  individual: NetworkServiceLevel[]
}

export interface VendorService {
  key: string
  vendorName: string
  url: string
  phone: string
  serviceDescription: string
  serviceTypeCode: string
}

export interface AdditionalInfo {
  fundingType: string
  fundingArrangementDescription: string
  businessSegment: string
  sizeDefinitionDescription: string
  revenueArrangementDescription: string
  hsa: string
  cdhp: string
  cmsHId: string
  cmsPackageBenefitPlanCode: string
  cmsSegmentId: string
  cmsContractId: string
  benefitPlanId: string
  virtualVisit: string
  designatedVirtualClinicNetwork: string
  medicaidVariableCode: string
  hraBalance: string
  hraMessage: string
  hraUnavailableMessage: string
  graceMessageByState: string
  gracePaidThrough: string
  gracePeriodMonth: string
  medicareGuidelines: string
  medicareEntitlementReason: string
}

// Alias for backwards compat in the eligibility module
export type EligibilityRecord = EligibilityResponse
