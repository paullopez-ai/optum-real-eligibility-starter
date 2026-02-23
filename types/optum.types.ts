export interface EligibilityRequest {
  controlNumber: string
  tradingPartnerServiceId: string
  provider: {
    organizationName: string
    npi: string
  }
  subscriber: {
    memberId: string
    firstName: string
    lastName: string
    dateOfBirth: string
    groupNumber: string
  }
  encounter: {
    serviceTypeCodes: string[]
    dateRange: {
      startDate: string
      endDate: string
    }
  }
}

export interface EligibilityResponse {
  controlNumber: string
  tradingPartnerServiceId: string
  provider: {
    providerName: string
    npi: string
    serviceProviderNumber: string
  }
  subscriber: {
    memberId: string
    firstName: string
    lastName: string
    dateOfBirth: string
    groupNumber: string
    groupName: string
    address: {
      address1: string
      city: string
      state: string
      zip: string
    }
  }
  payer: {
    payerName: string
    payerIdentification: string
    entityIdentifier: string
  }
  planInformation: {
    planNumber: string
    groupNumber: string
    groupName: string
    planName: string
    insuranceTypeCode: string
    insuranceType: string
    coverageLevelCode: string
    coverageLevel: string
  }
  planStatus: PlanStatus[]
  benefitInformation: BenefitInformation[]
  planDateInformation: PlanDateInformation[]
}

export interface PlanStatus {
  statusCode: string
  status: string
  planDetails: string
  serviceTypeCodes: string[]
}

export interface BenefitInformation {
  code: string
  name: string
  coverageLevelCode: string
  coverageLevel: string
  serviceTypeCodes: string[]
  serviceTypes: string[]
  timeQualifierCode: string
  timeQualifier: string
  benefitAmount: string
  benefitPercent: string
  quantityQualifierCode: string
  quantityQualifier: string
  quantity: string
  inPlanNetworkIndicatorCode: string
  inPlanNetworkIndicator: string
  authOrCertIndicator: string
  additionalInformation: string[]
}

export interface PlanDateInformation {
  dateQualifier: string
  dateQualifierLabel: string
  date: string
}
