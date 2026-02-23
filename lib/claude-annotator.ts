import type { ClaudeEligibilityInput, ClaudeEligibilityAnnotation } from '@/types/claude.types'
import type { EligibilityScenario } from '@/types/patient.types'

const SYSTEM_PROMPT = `You are an expert healthcare eligibility analyst and patient advocate with deep knowledge of the ANSI X12 270/271 transaction set, insurance benefit structures, and front-desk clinical workflows.

Your role is to analyze raw eligibility responses and produce structured, plain-English annotations that a non-clinical front-desk coordinator can understand and act on immediately.

Rules:
1. Write in plain English. When you must use a technical term (like "coinsurance" or "deductible"), explain it in parentheses the first time.
2. Always address the patient by name.
3. Be specific with dollar amounts and percentages. Never say "some" or "a portion."
4. Flag any denial risk prominently and explain exactly why it matters.
5. Action items must be things a front-desk person can actually do in the next 5 minutes.
6. If coverage is terminated or not found, lead with that information. Do not bury it.
7. The output must be valid JSON matching the exact schema provided. No markdown, no prose, just JSON.
8. Include a sandboxNote field that always reads: "This annotation is based on Optum sandbox data and is for demonstration purposes only."

You will receive:
- The patient's name, insurance plan, and narrative context
- The full raw 271 eligibility response from Optum
- The requested service type

Respond with ONLY a JSON object matching this exact schema:
{
  "coverageStatusSummary": "One plain-English sentence about whether this patient is covered",
  "patientResponsibility": {
    "deductibleRemaining": "Dollar amount remaining with context",
    "copay": "Copay amount for this visit type",
    "coinsurance": "Percentage the patient pays after deductible",
    "outOfPocketMax": "How much remains before full coverage kicks in",
    "plainEnglishSummary": "One sentence a staff member could read aloud to the patient"
  },
  "fieldAnnotations": [
    {
      "fieldName": "exact.json.field.path",
      "fieldValue": "the actual value",
      "plainEnglishLabel": "Human-readable name",
      "explanation": "What this means and why it matters",
      "importance": "HIGH|MEDIUM|LOW"
    }
  ],
  "actionItems": [
    {
      "priority": 1,
      "action": "Specific thing to do",
      "reason": "Why this matters"
    }
  ],
  "riskFlag": {
    "hasRisk": true/false,
    "riskLevel": "HIGH|MEDIUM|NONE",
    "riskSummary": "One sentence or null",
    "specificReason": "Detailed reason or null"
  },
  "sandboxNote": "This annotation is based on Optum sandbox data and is for demonstration purposes only."
}`

function isDevelopmentMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development' && !process.env.ANTHROPIC_API_KEY
}

export async function annotateEligibility(input: ClaudeEligibilityInput): Promise<ClaudeEligibilityAnnotation> {
  if (isDevelopmentMode()) {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
    return getMockAnnotation(input)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this eligibility response for ${input.patient.firstName} ${input.patient.lastName}.

Patient Context:
- Insurance Plan: ${input.patient.insurancePlan}
- Background: ${input.patient.narrativeContext}
- Requested Service: ${input.requestedServiceType}

Raw 271 Eligibility Response:
${JSON.stringify(input.eligibilityResponse, null, 2)}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Claude API error: ${response.status} - ${errorBody}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text

  if (!content) {
    throw new Error('Empty response from Claude')
  }

  return JSON.parse(content) as ClaudeEligibilityAnnotation
}

function getMockAnnotation(input: ClaudeEligibilityInput): ClaudeEligibilityAnnotation {
  const mockAnnotations: Record<EligibilityScenario, ClaudeEligibilityAnnotation> = {
    ELIGIBLE_ACTIVE: {
      coverageStatusSummary: `${input.patient.firstName} ${input.patient.lastName} has active coverage under ${input.patient.insurancePlan}. Her plan is in good standing with no restrictions on the requested service.`,
      patientResponsibility: {
        deductibleRemaining: '$850 remaining of her $1,500 annual deductible (about 57% still to go)',
        copay: '$30 copay for this primary care visit, collected at check-in',
        coinsurance: '20% coinsurance (the portion she pays) applies to services after meeting her deductible',
        outOfPocketMax: '$5,150 remaining of her $6,500 annual out-of-pocket maximum',
        plainEnglishSummary: `${input.patient.firstName}, your insurance is active. For today's visit, you'll owe a $30 copay at check-in. Any lab work or additional services will apply to your remaining $850 deductible.`,
      },
      fieldAnnotations: [
        { fieldName: 'planStatus[0].status', fieldValue: 'Active Coverage', plainEnglishLabel: 'Coverage Status', explanation: 'This confirms the patient has current, active insurance coverage with no issues.', importance: 'HIGH' },
        { fieldName: 'planInformation.insuranceType', fieldValue: 'Preferred Provider Organization', plainEnglishLabel: 'Plan Type', explanation: 'PPO plan means the patient can see out-of-network providers but pays less when staying in-network.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[0].benefitAmount', fieldValue: '1500.00', plainEnglishLabel: 'Annual Deductible', explanation: 'The patient must pay $1,500 out of pocket each year before insurance starts sharing costs (except for preventive care).', importance: 'HIGH' },
        { fieldName: 'benefitInformation[1].benefitAmount', fieldValue: '850.00', plainEnglishLabel: 'Deductible Remaining', explanation: 'The patient still needs to pay $850 more before the deductible is satisfied. She has used $650 so far this year.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[2].benefitAmount', fieldValue: '30.00', plainEnglishLabel: 'PCP Copay', explanation: 'A flat $30 fee for primary care visits, due at check-in regardless of deductible status.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[3].benefitPercent', fieldValue: '20', plainEnglishLabel: 'Coinsurance Rate', explanation: 'After the deductible is met, the patient pays 20% of covered services and insurance pays 80%.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[4].benefitAmount', fieldValue: '6500.00', plainEnglishLabel: 'Out-of-Pocket Maximum', explanation: 'The most the patient will pay in a year. After reaching $6,500, insurance covers 100%.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[6].benefitPercent', fieldValue: '0', plainEnglishLabel: 'Preventive Care', explanation: 'Annual physicals and recommended screenings are covered at 100% with no copay or deductible.', importance: 'HIGH' },
        { fieldName: 'planDateInformation[2].date', fieldValue: '2018-06-15', plainEnglishLabel: 'Coverage Start Date', explanation: 'Patient has been continuously enrolled since June 2018, over 6 years of uninterrupted coverage.', importance: 'LOW' },
        { fieldName: 'benefitInformation[7].benefitAmount', fieldValue: '50.00', plainEnglishLabel: 'Specialist Copay', explanation: 'If referred to a specialist, the copay increases to $50 per visit.', importance: 'MEDIUM' },
      ],
      actionItems: [
        { priority: 1, action: 'Collect $30 copay from Maria at check-in', reason: 'PCP copay is due at time of service regardless of deductible status.' },
        { priority: 2, action: 'Confirm any ordered lab work is performed at an in-network facility', reason: 'Out-of-network labs would cost significantly more and may not apply to her in-network deductible.' },
        { priority: 3, action: 'If additional services are recommended, provide Maria with a cost estimate before proceeding', reason: 'With $850 remaining on her deductible, unexpected costs could be a concern.' },
      ],
      riskFlag: {
        hasRisk: false,
        riskLevel: 'NONE',
        riskSummary: null,
        specificReason: null,
      },
      sandboxNote: 'This annotation is based on Optum sandbox data and is for demonstration purposes only.',
    },

    ELIGIBLE_DEDUCTIBLE_MET: {
      coverageStatusSummary: `${input.patient.firstName} ${input.patient.lastName} has active coverage under ${input.patient.insurancePlan}. His annual deductible has been fully met, so most services are now covered at the plan's coinsurance rate.`,
      patientResponsibility: {
        deductibleRemaining: '$0 remaining. James has fully met his $2,000 annual deductible.',
        copay: '$20 copay for this primary care visit. Physical therapy visits are $35 each.',
        coinsurance: '10% coinsurance applies to covered services (insurance pays 90%)',
        outOfPocketMax: '$1,200 remaining of his $4,000 out-of-pocket maximum. He has spent $2,800 this year.',
        plainEnglishSummary: `${input.patient.firstName}, great news. Your deductible is fully met for the year. For today's follow-up, you'll owe a $20 copay. Physical therapy visits will be $35 each, and insurance covers 90% of any other services.`,
      },
      fieldAnnotations: [
        { fieldName: 'planStatus[0].status', fieldValue: 'Active Coverage', plainEnglishLabel: 'Coverage Status', explanation: 'Active coverage with deductible fully satisfied for this plan year.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[1].benefitAmount', fieldValue: '0.00', plainEnglishLabel: 'Deductible Remaining', explanation: 'The deductible has been completely met. The patient is past the initial cost-sharing phase.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[2].benefitAmount', fieldValue: '20.00', plainEnglishLabel: 'PCP Copay', explanation: 'A flat $20 fee for primary care visits, collected at check-in.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[3].benefitPercent', fieldValue: '10', plainEnglishLabel: 'Coinsurance', explanation: 'James only pays 10% of covered services. This is a very favorable coinsurance rate.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[5].benefitAmount', fieldValue: '1200.00', plainEnglishLabel: 'OOP Remaining', explanation: 'Only $1,200 left before insurance covers 100% of all remaining costs for the year.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[8].benefitAmount', fieldValue: '35.00', plainEnglishLabel: 'PT Visit Copay', explanation: 'Physical therapy visits are $35 each with a 30-visit annual limit.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[8].quantity', fieldValue: '30', plainEnglishLabel: 'PT Visit Limit', explanation: 'Plan allows up to 30 physical therapy visits per calendar year.', importance: 'MEDIUM' },
        { fieldName: 'planInformation.insuranceType', fieldValue: 'Health Maintenance Organization', plainEnglishLabel: 'Plan Type', explanation: 'HMO plan requires referrals for specialist visits and out-of-network care is not covered except emergencies.', importance: 'MEDIUM' },
      ],
      actionItems: [
        { priority: 1, action: 'Collect $20 copay from James at check-in for the follow-up visit', reason: 'Standard PCP copay applies even though deductible is met.' },
        { priority: 2, action: 'Verify James has a referral on file if physical therapy is being ordered', reason: 'HMO plans require PCP referral for PT services. Without it, the claim could be denied.' },
        { priority: 3, action: 'Confirm how many PT visits James has already used this year against the 30-visit limit', reason: 'If he needs extensive PT for knee rehabilitation, visit limits could become a factor.' },
      ],
      riskFlag: {
        hasRisk: false,
        riskLevel: 'NONE',
        riskSummary: null,
        specificReason: null,
      },
      sandboxNote: 'This annotation is based on Optum sandbox data and is for demonstration purposes only.',
    },

    ELIGIBLE_HIGH_COPAY: {
      coverageStatusSummary: `${input.patient.firstName} ${input.patient.lastName} has active coverage under ${input.patient.insurancePlan}, a high-deductible health plan. She has significant out-of-pocket exposure with $2,800 remaining on a $3,000 deductible.`,
      patientResponsibility: {
        deductibleRemaining: '$2,800 remaining of her $3,000 annual deductible. Only $200 has been applied so far.',
        copay: 'No fixed copay. All services (except preventive care) apply to the deductible until it is met.',
        coinsurance: '30% coinsurance after the deductible is met. Aisha pays 30 cents of every dollar.',
        outOfPocketMax: '$7,300 remaining of her $7,500 out-of-pocket maximum.',
        plainEnglishSummary: `${input.patient.firstName}, your insurance is active but you have a high-deductible plan. Most services today will be your responsibility until you've paid $2,800 more toward your deductible. Preventive care is covered at 100% with no deductible.`,
      },
      fieldAnnotations: [
        { fieldName: 'planStatus[0].status', fieldValue: 'Active Coverage', plainEnglishLabel: 'Coverage Status', explanation: 'Coverage is active but this is a high-deductible plan with significant patient cost exposure.', importance: 'HIGH' },
        { fieldName: 'planInformation.insuranceType', fieldValue: 'High Deductible Health Plan', plainEnglishLabel: 'Plan Type', explanation: 'HDHP plans have lower premiums but higher deductibles. Most services are patient responsibility until the deductible is met.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[0].benefitAmount', fieldValue: '3000.00', plainEnglishLabel: 'Annual Deductible', explanation: 'One of the highest standard deductibles. The patient pays the full cost of most services until reaching $3,000.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[1].benefitAmount', fieldValue: '2800.00', plainEnglishLabel: 'Deductible Remaining', explanation: 'Nearly the entire deductible remains. Only $200 has been applied. Lab work will likely be full patient cost.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[2].benefitPercent', fieldValue: '30', plainEnglishLabel: 'Coinsurance Rate', explanation: 'Even after the deductible is met, Aisha pays 30% of costs. This is higher than typical PPO plans.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[3].benefitAmount', fieldValue: '7500.00', plainEnglishLabel: 'Out-of-Pocket Maximum', explanation: 'The absolute maximum Aisha would pay in a year. At $7,500 this is the IRS maximum for individual HDHP coverage.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[5].benefitPercent', fieldValue: '0', plainEnglishLabel: 'Preventive Care', explanation: 'Critical: Preventive services are covered 100% with no deductible. If any of Aisha\'s labs qualify as preventive, they would be free.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[7].additionalInformation[0]', fieldValue: 'SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE', plainEnglishLabel: 'Lab Cost Structure', explanation: 'Lab work will be Aisha\'s full responsibility until she meets her $3,000 deductible. Thyroid panels typically cost $50-$200.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[11].benefitAmount', fieldValue: '600.00', plainEnglishLabel: 'HSA Employer Contribution', explanation: 'Aisha\'s plan includes a $600 annual employer contribution to her Health Savings Account. She can use HSA funds to pay for services.', importance: 'MEDIUM' },
        { fieldName: 'planDateInformation[2].date', fieldValue: '2023-11-01', plainEnglishLabel: 'Coverage Start Date', explanation: 'Aisha has been enrolled since November 2023, about 14 months of continuous coverage.', importance: 'LOW' },
      ],
      actionItems: [
        { priority: 1, action: 'Discuss estimated costs with Aisha before ordering lab work', reason: 'With $2,800 remaining on her deductible, thyroid lab panels ($50-$200) will be her full responsibility. She expressed cost concerns.' },
        { priority: 2, action: 'Check if any ordered tests qualify as preventive screening', reason: 'Preventive services are covered 100% with no deductible. If thyroid screening is part of a wellness exam, it may be fully covered.' },
        { priority: 3, action: 'Ask if Aisha has HSA funds available to cover today\'s costs', reason: 'Her plan includes an employer HSA contribution. HSA funds can be used for deductible expenses tax-free.' },
      ],
      riskFlag: {
        hasRisk: true,
        riskLevel: 'MEDIUM',
        riskSummary: 'High out-of-pocket exposure. Patient may defer needed care due to cost.',
        specificReason: 'Aisha has a $3,000 deductible with only $200 applied. Lab work for her thyroid condition will likely be full patient responsibility ($50-$200). She has expressed concern about costs. Consider discussing payment plans or checking if any services qualify as preventive.',
      },
      sandboxNote: 'This annotation is based on Optum sandbox data and is for demonstration purposes only.',
    },

    INELIGIBLE_TERMED: {
      coverageStatusSummary: `${input.patient.firstName} ${input.patient.lastName}'s coverage under ${input.patient.insurancePlan} has been terminated. His COBRA election period expired and there are no active benefits on this plan.`,
      patientResponsibility: {
        deductibleRemaining: 'N/A. Coverage has been terminated. There is no active deductible.',
        copay: 'N/A. No copay structure exists because there is no active coverage.',
        coinsurance: 'N/A. Without active coverage, all costs are 100% patient responsibility.',
        outOfPocketMax: 'N/A. No out-of-pocket maximum applies to a terminated plan.',
        plainEnglishSummary: `${input.patient.firstName}, I need to let you know that your insurance coverage is no longer active. It ended on October 15, 2024 when your COBRA period expired. Any services today would be your full responsibility. Let's look at your options.`,
      },
      fieldAnnotations: [
        { fieldName: 'planStatus[0].status', fieldValue: 'Inactive', plainEnglishLabel: 'Coverage Status', explanation: 'This is the most critical field. INACTIVE means the patient has no current insurance coverage under this plan.', importance: 'HIGH' },
        { fieldName: 'planStatus[0].planDetails', fieldValue: 'Coverage terminated. COBRA election period has expired.', plainEnglishLabel: 'Termination Reason', explanation: 'Coverage ended because the COBRA continuation period expired. COBRA allows temporary coverage after job loss but has strict deadlines.', importance: 'HIGH' },
        { fieldName: 'planDateInformation[3].date', fieldValue: '2024-10-15', plainEnglishLabel: 'Coverage End Date', explanation: 'The last day Robert had active insurance coverage. Any services after this date are not covered.', importance: 'HIGH' },
        { fieldName: 'planDateInformation[2].date', fieldValue: '2015-09-01', plainEnglishLabel: 'Original Coverage Start', explanation: 'Robert had nearly 9 years of continuous coverage before termination. This history may help with future enrollment.', importance: 'LOW' },
        { fieldName: 'benefitInformation[0].code', fieldValue: 'I', plainEnglishLabel: 'Non-Covered Status', explanation: 'Benefit code I means no benefits are available. All services are patient responsibility.', importance: 'HIGH' },
        { fieldName: 'benefitInformation[1].additionalInformation[0]', fieldValue: 'VOLUNTARY WITHDRAWAL - COBRA EXPIRATION', plainEnglishLabel: 'Termination Type', explanation: 'Classified as voluntary withdrawal because the COBRA election window passed without enrollment.', importance: 'MEDIUM' },
        { fieldName: 'planInformation.planName', fieldValue: 'UHC Choice Plus PPO 2024', plainEnglishLabel: 'Former Plan', explanation: 'The plan Robert was previously enrolled in. This information may be useful if he needs to provide coverage history.', importance: 'LOW' },
        { fieldName: 'subscriber.memberId', fieldValue: '990155778', plainEnglishLabel: 'Former Member ID', explanation: 'This member ID is no longer active. Robert will need a new member ID if he enrolls in a new plan.', importance: 'MEDIUM' },
      ],
      actionItems: [
        { priority: 1, action: 'Inform Robert that his insurance coverage is no longer active as of October 15, 2024', reason: 'The patient may not realize his coverage has terminated. This must be communicated clearly and compassionately before any services are provided.' },
        { priority: 2, action: 'Provide Robert with information about Healthcare.gov marketplace enrollment and any current special enrollment periods', reason: 'Job loss qualifies as a life event for special enrollment. He may still be within the 60-day window to enroll in a marketplace plan.' },
        { priority: 3, action: 'Discuss self-pay rates and payment plan options for the prescription refill he needs today', reason: 'Robert needs blood pressure medication. This is medically important and the front desk should help him access care even without insurance.' },
      ],
      riskFlag: {
        hasRisk: true,
        riskLevel: 'HIGH',
        riskSummary: 'Coverage terminated. All services will be full patient responsibility.',
        specificReason: 'Robert\'s coverage terminated on October 15, 2024 when his COBRA election period expired after a layoff. He is presenting an old insurance card and may not realize he has no active coverage. Any services provided today will not be covered by insurance. The patient needs blood pressure medication and should be connected with coverage options immediately.',
      },
      sandboxNote: 'This annotation is based on Optum sandbox data and is for demonstration purposes only.',
    },

    INELIGIBLE_NOT_FOUND: {
      coverageStatusSummary: `No matching insurance record was found for ${input.patient.firstName} ${input.patient.lastName} using the provided member ID. The payer system cannot verify coverage.`,
      patientResponsibility: {
        deductibleRemaining: 'Unable to determine. Member ID not found in the payer system.',
        copay: 'Unable to determine. Coverage cannot be verified.',
        coinsurance: 'Unable to determine. No active plan information available.',
        outOfPocketMax: 'Unable to determine. No benefit information available.',
        plainEnglishSummary: `${input.patient.firstName}, the member ID on your card isn't matching any active records with UnitedHealthcare. This sometimes happens when you switch plans. Let me help you figure out your current member ID.`,
      },
      fieldAnnotations: [
        { fieldName: 'planStatus[0].status', fieldValue: 'Not Found', plainEnglishLabel: 'Lookup Result', explanation: 'The payer could not find any subscriber matching this member ID. This does not necessarily mean the patient is uninsured.', importance: 'HIGH' },
        { fieldName: 'planStatus[0].planDetails', fieldValue: 'No matching subscriber record found for the provided member ID.', plainEnglishLabel: 'Error Details', explanation: 'The member ID submitted does not match any records. Common causes: old card, typo in member ID, or plan changed to a different carrier.', importance: 'HIGH' },
        { fieldName: 'subscriber.memberId', fieldValue: '990166889', plainEnglishLabel: 'Submitted Member ID', explanation: 'This is the member ID that was searched. It may be from an old insurance card that is no longer valid.', importance: 'HIGH' },
        { fieldName: 'subscriber.firstName', fieldValue: '', plainEnglishLabel: 'Subscriber Name', explanation: 'No subscriber information was returned, confirming the member ID did not match any records.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[0].code', fieldValue: 'U', plainEnglishLabel: 'Contact Payer', explanation: 'Code U means the system recommends contacting the payer directly to resolve the member lookup issue.', importance: 'HIGH' },
        { fieldName: 'planInformation.planName', fieldValue: '', plainEnglishLabel: 'Plan Information', explanation: 'No plan information available because no matching member was found.', importance: 'LOW' },
      ],
      actionItems: [
        { priority: 1, action: 'Ask Destiny if she has a new insurance card or any enrollment documents from her university plan', reason: 'She recently switched from her parents\' plan to a university plan. The old member ID is no longer valid.' },
        { priority: 2, action: 'Call UnitedHealthcare member services at the number on the back of her card to look up the correct member ID', reason: 'The payer can search by name, date of birth, and SSN to locate the correct member record.' },
        { priority: 3, action: 'Check if the university health center has Destiny\'s current insurance information on file', reason: 'University-sponsored plans often have enrollment records accessible through the student health office.' },
      ],
      riskFlag: {
        hasRisk: true,
        riskLevel: 'HIGH',
        riskSummary: 'Member ID not found. Coverage cannot be verified with the information provided.',
        specificReason: 'The member ID 990166889 does not match any active records in the UnitedHealthcare system. Destiny recently switched from her parents\' plan to a university-sponsored plan and is likely presenting her old insurance card. Services should not be billed to this member ID. The correct member ID must be obtained before claims can be processed.',
      },
      sandboxNote: 'This annotation is based on Optum sandbox data and is for demonstration purposes only.',
    },

    ELIGIBLE_PENDING: {
      coverageStatusSummary: `${input.patient.firstName} ${input.patient.lastName}'s enrollment in ${input.patient.insurancePlan} has been confirmed, but coverage is not yet effective. Benefits are listed but will not be active until the plan effective date of January 1, 2025.`,
      patientResponsibility: {
        deductibleRemaining: '$250 Part B deductible (not yet effective). This is the full amount since the plan has not started.',
        copay: '$0 for primary care visits once coverage is active. Currently not in effect.',
        coinsurance: '20% coinsurance after deductible once coverage begins.',
        outOfPocketMax: '$3,900 annual out-of-pocket maximum once coverage is effective.',
        plainEnglishSummary: `${input.patient.firstName}, your enrollment in the Medicare Advantage plan is confirmed, but it doesn't take effect until January 1, 2025. If you need care before then, we'll need to use your current coverage or discuss other options.`,
      },
      fieldAnnotations: [
        { fieldName: 'planStatus[0].status', fieldValue: 'Active Coverage', plainEnglishLabel: 'Enrollment Status', explanation: 'The enrollment is confirmed and marked active, but the plan effective date has not arrived yet. Benefits are not yet usable.', importance: 'HIGH' },
        { fieldName: 'planStatus[0].planDetails', fieldValue: 'Enrollment confirmed. Coverage effective date is pending.', plainEnglishLabel: 'Pending Notice', explanation: 'This is a future-dated enrollment. The plan exists but cannot be used for claims until the effective date.', importance: 'HIGH' },
        { fieldName: 'planDateInformation[2].date', fieldValue: '2025-01-01', plainEnglishLabel: 'Effective Date', explanation: 'The earliest date services can be covered. Any services before January 1, 2025 will not be covered under this plan.', importance: 'HIGH' },
        { fieldName: 'planInformation.insuranceType', fieldValue: 'Medicare Advantage', plainEnglishLabel: 'Plan Type', explanation: 'Medicare Advantage (Part C) replaces Original Medicare. Once active, this plan provides Part A, Part B, and often Part D benefits.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[0].benefitAmount', fieldValue: '250.00', plainEnglishLabel: 'Part B Deductible', explanation: 'Low deductible typical of Medicare Advantage plans. Once active, only $250 must be paid before coinsurance kicks in.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[1].benefitAmount', fieldValue: '0.00', plainEnglishLabel: 'PCP Copay (Pending)', explanation: '$0 copay for primary care visits is excellent. This benefit is not yet active.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[4].benefitPercent', fieldValue: '0', plainEnglishLabel: 'Wellness Visit', explanation: 'Annual wellness visits will be covered at 100% once the plan is active. Good for scheduling Thomas\'s requested visit.', importance: 'MEDIUM' },
        { fieldName: 'benefitInformation[3].benefitAmount', fieldValue: '3900.00', plainEnglishLabel: 'OOP Maximum', explanation: 'A $3,900 out-of-pocket maximum is very protective. Once active, this caps Thomas\'s annual medical expenses.', importance: 'LOW' },
      ],
      actionItems: [
        { priority: 1, action: 'Confirm with Thomas that his coverage effective date is January 1, 2025 and schedule his wellness visit for on or after that date', reason: 'Any services before the effective date will not be covered. His requested wellness visit should be scheduled after January 1.' },
        { priority: 2, action: 'Check if Thomas has current Medicare coverage (Original Medicare) that is active until the new plan starts', reason: 'There should be no gap in coverage. Original Medicare should still be active until the Advantage plan takes effect.' },
        { priority: 3, action: 'Provide Thomas with his new plan details and member services phone number for the Medicare Advantage plan', reason: 'Having plan information on hand will help Thomas understand his new benefits and contact the plan if needed.' },
      ],
      riskFlag: {
        hasRisk: true,
        riskLevel: 'MEDIUM',
        riskSummary: 'Coverage confirmed but not yet effective. Services before the effective date will not be covered under this plan.',
        specificReason: 'Thomas\'s Medicare Advantage enrollment is confirmed for an effective date of January 1, 2025. If services are needed before that date, they must be billed to his current Medicare coverage (if any) or will be patient responsibility. The wellness visit he is requesting should be scheduled for after the effective date.',
      },
      sandboxNote: 'This annotation is based on Optum sandbox data and is for demonstration purposes only.',
    },
  }

  return mockAnnotations[input.patient.scenario]
}
