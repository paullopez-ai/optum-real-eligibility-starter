import type { ClaudeEligibilityInput, ClaudeEligibilityAnnotation } from '@/types/claude.types'

const SYSTEM_PROMPT = `You are a healthcare eligibility analyst. You receive raw JSON from the Optum Real Pre-Service Eligibility API (GraphQL) and produce structured, plain-English summaries for front-desk healthcare staff.

## How to read the response

The response is a single eligibility record with these key sections:

1. **eligibilityInfo.insuranceInfo** — The core coverage record.
   - \`policyStatus\`: "Active Policy", "Past Policy", "Future Policy", or "Not Found" determines everything.
   - \`eligibilityStartDate\` / \`eligibilityEndDate\`: When coverage is/was valid.
   - \`insuranceType\`: Plan structure (PPO, HMO, HDHP, Medicare Advantage, etc.).
   - \`groupName\`: Employer group or plan name.

2. **eligibilityInfo.planLevels[]** — Plan-level financial amounts.
   - Each entry has a \`level\` field: "deductibleInfo", "outOfPocketInfo", "copayMaxInfo", etc.
   - Under \`individual[]\` and \`family[]\`, look for \`planAmount\` (annual limit) and \`remainingAmount\` (what's left).
   - \`networkStatus\` indicates "InNetwork" vs "OutOfNetwork".

3. **serviceLevels[].individual[].services[]** — Service-specific benefit details.
   - Each service has \`message.coPay.messages[]\` (copay text), \`message.coInsurance.messages[]\` (coinsurance text), and \`message.deductible.messages[]\`.
   - The \`status\` field ("Active" or "Inactive") confirms if that service is covered.
   - \`message.coPay.subMessages[].copay\` contains the exact copay dollar amount (e.g., "$30").

4. **primaryCarePhysician** — PCP name and contact info (may be null).

5. **providerNetwork** — Whether the requesting provider is in-network, and their tier.

6. **additionalInfo** — HSA eligibility (\`hsa\`), funding type, Medicare info.

## Rules

1. **Extract real numbers.** Pull exact dollar amounts from \`planLevels\` and \`serviceLevels\`. For deductible remaining, find the planLevel where \`level\` contains "deductible" and read \`individual[0].remainingAmount\`. For OOP max, find \`level\` containing "outOfPocket". For copays, read from \`serviceLevels[].individual[].services[].message.coPay\`.
2. **Determine coverage status first.** Check \`policyStatus\`. If "Past Policy" → terminated. If "Future Policy" → pending. If "Not Found" or member data is empty → not found. Only if "Active Policy" proceed to financial analysis.
3. **Write for non-technical readers.** Explain terms like "coinsurance" (the percentage you pay after meeting your deductible) and "out-of-pocket maximum" (the most you'll pay in a year before insurance covers 100%).
4. **Be specific in action items.** "Collect the $30 copay at check-in" is good. "Review the response" is not.
5. **Flag financial risk.** HIGH risk: terminated, not found, or very high remaining deductible (>$2000). MEDIUM risk: pending coverage, or high coinsurance (>20%). NONE: active with low remaining costs.
6. **Annotate 4-6 fields** that matter most for the visit. Always include policyStatus, deductible remaining, copay, and coinsurance. Add planType and OOP max if active.
7. Respond with ONLY valid JSON matching the schema below. No markdown fences, no commentary.

## Output schema
{
  "coverageStatusSummary": "One sentence: is this patient covered, and under what plan?",
  "patientResponsibility": {
    "deductibleRemaining": "$X.XX remaining of $Y.YY annual deductible (or N/A with reason)",
    "copay": "$X for [service type] (or N/A with reason)",
    "coinsurance": "X% after deductible (or N/A with reason)",
    "outOfPocketMax": "$X.XX remaining of $Y.YY annual maximum (or N/A with reason)",
    "plainEnglishSummary": "One sentence: what will this patient likely owe for today's visit?"
  },
  "fieldAnnotations": [
    {
      "fieldName": "dot.path.to.field",
      "fieldValue": "actual value from the response",
      "plainEnglishLabel": "Human-readable label",
      "explanation": "What this means and why it matters for today's visit",
      "importance": "HIGH|MEDIUM|LOW"
    }
  ],
  "actionItems": [
    {
      "priority": 1,
      "action": "Specific action the front desk should take right now",
      "reason": "Why this matters"
    }
  ],
  "riskFlag": {
    "hasRisk": true/false,
    "riskLevel": "HIGH|MEDIUM|NONE",
    "riskSummary": "One sentence (or null if NONE)",
    "specificReason": "Detailed explanation (or null if NONE)"
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
      max_tokens: 2000,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this eligibility response for ${input.patient.firstName} ${input.patient.lastName}.

Patient Context:
- Insurance Plan: ${input.patient.insurancePlan}
- Requested Service: ${input.requestedServiceType}

Raw Eligibility Response (GraphQL):
${JSON.stringify(input.eligibilityResponse, null, 2)}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(45000),
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
  const { firstName, lastName, insurancePlan, scenario } = input.patient

  const base = {
    sandboxNote: 'This annotation is based on Optum sandbox data and is for demonstration purposes only.',
  }

  if (scenario === 'INELIGIBLE_TERMED') {
    return {
      ...base,
      coverageStatusSummary: `${firstName} ${lastName}'s coverage under ${insurancePlan} is no longer active. The policy status shows "Past Policy," meaning this plan has been terminated.`,
      patientResponsibility: {
        deductibleRemaining: 'N/A — coverage is terminated.',
        copay: 'N/A — no active coverage. All services are full patient responsibility.',
        coinsurance: 'N/A — no active plan to apply coinsurance against.',
        outOfPocketMax: 'N/A — no active plan.',
        plainEnglishSummary: `${firstName} has no active insurance under this plan. Any services today would be billed entirely to the patient.`,
      },
      fieldAnnotations: [
        { fieldName: 'eligibilityInfo.insuranceInfo.policyStatus', fieldValue: 'Past Policy', plainEnglishLabel: 'Coverage Status', explanation: '"Past Policy" means this insurance plan has ended. The patient had coverage previously but it is no longer active.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.insuranceInfo.eligibilityEndDate', fieldValue: '2024-10-15', plainEnglishLabel: 'Coverage End Date', explanation: 'Coverage ended on this date. Any services after this date are not covered under this plan.', importance: 'HIGH' },
        { fieldName: 'serviceLevels[0].individual[0].services[0].status', fieldValue: 'Inactive', plainEnglishLabel: 'Service Status', explanation: 'Benefits under this plan are inactive — no claims can be processed.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.insuranceInfo.insuranceType', fieldValue: 'Preferred Provider Organization (PPO)', plainEnglishLabel: 'Former Plan Type', explanation: 'This was a PPO plan. The plan type no longer matters since coverage is terminated.', importance: 'LOW' },
      ],
      actionItems: [
        { priority: 1, action: `Inform ${firstName} that their ${insurancePlan} coverage terminated on 10/15/2024 before providing any services.`, reason: 'Services rendered without active coverage will not be reimbursed. The patient must understand they are financially responsible.' },
        { priority: 2, action: `Ask ${firstName} if they have obtained new insurance coverage since the termination date.`, reason: 'The patient may have enrolled in a new plan through a new employer, marketplace, or COBRA that we can verify instead.' },
        { priority: 3, action: 'If no other coverage exists, discuss self-pay rates and payment plan options.', reason: 'The patient may still need care. Providing cost transparency upfront prevents billing surprises.' },
      ],
      riskFlag: {
        hasRisk: true,
        riskLevel: 'HIGH',
        riskSummary: 'Coverage terminated — all services will be full patient responsibility.',
        specificReason: `${firstName} ${lastName}'s plan shows "Past Policy" with an eligibility end date that has passed. No benefits are available. Do not bill this plan for any services.`,
      },
    }
  }

  if (scenario === 'INELIGIBLE_NOT_FOUND') {
    return {
      ...base,
      coverageStatusSummary: `No active insurance record was found for ${firstName} ${lastName}. The system returned an empty member record, meaning the member ID could not be matched to any policy.`,
      patientResponsibility: {
        deductibleRemaining: 'Unable to determine — no member record found.',
        copay: 'Unable to determine — coverage cannot be verified.',
        coinsurance: 'Unable to determine — no plan information available.',
        outOfPocketMax: 'Unable to determine — no plan information available.',
        plainEnglishSummary: `We could not verify any insurance coverage for ${firstName}. This does not necessarily mean they are uninsured — the member ID may be incorrect.`,
      },
      fieldAnnotations: [
        { fieldName: 'eligibilityInfo.insuranceInfo.policyStatus', fieldValue: 'Not Found', plainEnglishLabel: 'Lookup Result', explanation: 'The payer system could not find any subscriber matching the member ID provided. This could mean the ID is wrong, expired, or belongs to a different payer.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.member.firstName', fieldValue: '', plainEnglishLabel: 'Returned Member Name', explanation: 'The response came back with empty member details, confirming no match was found in the payer system.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.planLevels', fieldValue: '[]', plainEnglishLabel: 'Plan Benefits', explanation: 'No plan-level financial information was returned because no matching policy exists.', importance: 'MEDIUM' },
      ],
      actionItems: [
        { priority: 1, action: `Ask ${firstName} for a current insurance card or recent enrollment letter and verify the member ID.`, reason: 'The most common cause of "not found" is a typo in the member ID or using an old card from a previous plan year.' },
        { priority: 2, action: 'Try searching by name and date of birth by calling UnitedHealthcare provider services at 1-877-842-3210.', reason: 'Payers can often locate a member record using demographic information when the electronic lookup fails.' },
        { priority: 3, action: 'If the patient confirms they have UHC coverage, ask for the group number to narrow the search.', reason: 'The group number combined with date of birth is often enough to locate the correct policy.' },
      ],
      riskFlag: {
        hasRisk: true,
        riskLevel: 'HIGH',
        riskSummary: 'Member not found — coverage cannot be verified with the information provided.',
        specificReason: 'The member ID did not match any active or historical policy in the UnitedHealthcare system. Obtain updated insurance information before scheduling or providing services.',
      },
    }
  }

  if (scenario === 'ELIGIBLE_PENDING') {
    return {
      ...base,
      coverageStatusSummary: `${firstName} ${lastName} is enrolled in ${insurancePlan}, but coverage has a future effective date. The policy status shows "Future Policy," meaning benefits are not yet usable.`,
      patientResponsibility: {
        deductibleRemaining: '$250.00 remaining of $250.00 annual deductible — but not yet applicable until coverage starts.',
        copay: '$0 for PCP visits once coverage is effective (pending).',
        coinsurance: '20% after deductible once coverage is effective (pending).',
        outOfPocketMax: '$3,900.00 remaining of $3,900.00 annual maximum — not yet applicable.',
        plainEnglishSummary: `${firstName}'s enrollment is confirmed but coverage hasn't started yet. Services today would not be covered under this plan.`,
      },
      fieldAnnotations: [
        { fieldName: 'eligibilityInfo.insuranceInfo.policyStatus', fieldValue: 'Future Policy', plainEnglishLabel: 'Policy Status', explanation: '"Future Policy" means enrollment is confirmed but the plan effective date is in the future. Benefits cannot be used until that date arrives.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.insuranceInfo.eligibilityStartDate', fieldValue: '2025-01-01', plainEnglishLabel: 'Coverage Effective Date', explanation: 'This is when the plan becomes active and claims can be submitted. Services before this date will be denied.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.planLevels[0].individual[0].remainingAmount', fieldValue: '250.00', plainEnglishLabel: 'Deductible Remaining (Future)', explanation: 'The full deductible amount is remaining because the plan year has not started. This amount applies once coverage begins.', importance: 'MEDIUM' },
        { fieldName: 'eligibilityInfo.insuranceInfo.insuranceType', fieldValue: 'Medicare Advantage', plainEnglishLabel: 'Plan Type', explanation: 'This is a Medicare Advantage plan, which replaces Original Medicare with a private plan that typically includes additional benefits.', importance: 'MEDIUM' },
      ],
      actionItems: [
        { priority: 1, action: `Confirm with ${firstName} that their coverage effective date is 01/01/2025. Do not bill this plan for services before that date.`, reason: 'Claims submitted before the effective date will be denied by the payer.' },
        { priority: 2, action: `Ask ${firstName} if they have current coverage under a different plan (e.g., existing Medicare, employer plan, or marketplace plan).`, reason: 'There may be no gap in coverage if a prior plan is still active. That plan should be billed for today\'s services.' },
        { priority: 3, action: 'If the visit can wait, suggest rescheduling after the coverage effective date.', reason: 'The patient will have full benefits including $0 PCP copay once the plan is active.' },
      ],
      riskFlag: {
        hasRisk: true,
        riskLevel: 'MEDIUM',
        riskSummary: 'Enrollment confirmed but coverage is not yet effective — services today are not covered.',
        specificReason: `${firstName}'s ${insurancePlan} plan has a future effective date. The plan is real and enrolled, but cannot be billed until the start date. Check for transitional coverage.`,
      },
    }
  }

  if (scenario === 'ELIGIBLE_DEDUCTIBLE_MET') {
    return {
      ...base,
      coverageStatusSummary: `${firstName} ${lastName} has active coverage under ${insurancePlan}. The individual deductible has been fully met — only copays and coinsurance apply for most services.`,
      patientResponsibility: {
        deductibleRemaining: '$0.00 remaining of $2,000.00 annual deductible — fully satisfied.',
        copay: '$20 for a PCP office visit.',
        coinsurance: '10% after deductible (which is already met).',
        outOfPocketMax: '$1,200.00 remaining of $4,000.00 annual out-of-pocket maximum.',
        plainEnglishSummary: `${firstName}'s deductible is met for the year. For today's visit, expect a $20 copay at check-in. Any additional services will be covered at 90% by insurance.`,
      },
      fieldAnnotations: [
        { fieldName: 'eligibilityInfo.insuranceInfo.policyStatus', fieldValue: 'Active Policy', plainEnglishLabel: 'Coverage Status', explanation: 'Coverage is active and in good standing. Claims can be submitted normally.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.planLevels[0].individual[0].remainingAmount', fieldValue: '0.00', plainEnglishLabel: 'Deductible Remaining', explanation: 'The deductible (the amount you pay before insurance starts sharing costs) is fully met. This is great news — the patient has already satisfied their annual deductible.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.planLevels[1].individual[0].remainingAmount', fieldValue: '1200.00', plainEnglishLabel: 'Out-of-Pocket Remaining', explanation: '$1,200 remains before hitting the annual maximum. Once the OOP max is reached, insurance covers 100% of in-network services.', importance: 'HIGH' },
        { fieldName: 'serviceLevels[0].individual[0].services[0].message.coPay.messages[0]', fieldValue: '$20 / Visit PCP OFFICE VISIT COPAY', plainEnglishLabel: 'PCP Visit Copay', explanation: 'The fixed amount due at each primary care visit. This is collected at check-in regardless of deductible status.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.insuranceInfo.insuranceType', fieldValue: 'Health Maintenance Organization (HMO)', plainEnglishLabel: 'Plan Type', explanation: 'HMO plans require using in-network providers and typically require a PCP referral for specialists.', importance: 'MEDIUM' },
      ],
      actionItems: [
        { priority: 1, action: `Collect the $20 copay from ${firstName} at check-in.`, reason: 'The PCP copay is a fixed amount due at the time of service, even though the deductible is met.' },
        { priority: 2, action: 'If additional services are needed (labs, imaging), inform the patient they will owe 10% coinsurance.', reason: 'With the deductible met, insurance covers 90% but the patient still has $1,200 remaining toward their OOP max.' },
      ],
      riskFlag: {
        hasRisk: false,
        riskLevel: 'NONE',
        riskSummary: null,
        specificReason: null,
      },
    }
  }

  if (scenario === 'ELIGIBLE_HIGH_COPAY') {
    return {
      ...base,
      coverageStatusSummary: `${firstName} ${lastName} has active coverage under ${insurancePlan}, a High Deductible Health Plan (HDHP) with HSA eligibility. Most services are subject to the deductible before insurance pays.`,
      patientResponsibility: {
        deductibleRemaining: '$2,800.00 remaining of $3,000.00 annual deductible.',
        copay: 'No fixed copay — most services apply to the deductible first. Preventive care is $0.',
        coinsurance: '30% after deductible is met.',
        outOfPocketMax: '$7,300.00 remaining of $7,500.00 annual out-of-pocket maximum.',
        plainEnglishSummary: `${firstName} has a high-deductible plan with $2,800 remaining before insurance starts sharing costs. Today's visit will likely be billed at full cost toward the deductible, unless it's preventive care.`,
      },
      fieldAnnotations: [
        { fieldName: 'eligibilityInfo.insuranceInfo.policyStatus', fieldValue: 'Active Policy', plainEnglishLabel: 'Coverage Status', explanation: 'Coverage is active. However, this is an HDHP — most services require the patient to pay full cost until the deductible is met.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.planLevels[0].individual[0].remainingAmount', fieldValue: '2800.00', plainEnglishLabel: 'Deductible Remaining', explanation: '$2,800 of the $3,000 deductible remains. Until this is met, the patient pays the full negotiated rate for most services. Only $200 has been applied so far this year.', importance: 'HIGH' },
        { fieldName: 'eligibilityInfo.planLevels[1].individual[0].remainingAmount', fieldValue: '7300.00', plainEnglishLabel: 'Out-of-Pocket Remaining', explanation: 'The patient could pay up to $7,300 more this year before insurance covers 100%. This is a significant financial exposure.', importance: 'HIGH' },
        { fieldName: 'additionalInfo.hsa', fieldValue: 'Y', plainEnglishLabel: 'HSA Eligible', explanation: 'This plan qualifies for a Health Savings Account (HSA). The patient may have HSA funds available to cover today\'s costs. Ask if they want to pay with their HSA card.', importance: 'MEDIUM' },
        { fieldName: 'serviceLevels[0].individual[0].services[0].message.coPay.messages[0]', fieldValue: 'SUBJECT TO DEDUCTIBLE THEN 30% COINSURANCE', plainEnglishLabel: 'Cost-Sharing Structure', explanation: 'Most services follow a two-step cost model: first the patient pays 100% until the deductible is met, then they pay 30% (coinsurance) and insurance pays 70%.', importance: 'MEDIUM' },
      ],
      actionItems: [
        { priority: 1, action: `Inform ${firstName} that today's visit will likely apply toward their $2,800 remaining deductible. Provide an estimate of expected charges.`, reason: 'HDHP patients often face higher-than-expected bills. Cost transparency upfront prevents billing complaints.' },
        { priority: 2, action: `Ask ${firstName} if they have an HSA card they would like to use for payment.`, reason: 'The plan is HSA-eligible and the patient may have pre-tax funds available to cover their costs.' },
        { priority: 3, action: 'If this is a preventive care visit (annual wellness, screening), confirm it is coded correctly to qualify for $0 cost-sharing.', reason: 'Preventive services are covered at 100% even on HDHPs, but only if coded as preventive — not diagnostic.' },
      ],
      riskFlag: {
        hasRisk: true,
        riskLevel: 'MEDIUM',
        riskSummary: 'High-deductible plan with $2,800 remaining — patient faces significant out-of-pocket cost.',
        specificReason: `${firstName} has an HDHP with most of the $3,000 deductible still unmet. Non-preventive services will be billed at full negotiated rates. Ensure the patient understands their cost exposure before proceeding.`,
      },
    }
  }

  // ELIGIBLE_ACTIVE (default)
  return {
    ...base,
    coverageStatusSummary: `${firstName} ${lastName} has active coverage under ${insurancePlan}. The plan is a PPO in good standing with a partially met deductible.`,
    patientResponsibility: {
      deductibleRemaining: '$850.00 remaining of $1,500.00 annual deductible.',
      copay: '$30 for a PCP office visit. $50 for a specialist visit.',
      coinsurance: '20% after deductible for most services.',
      outOfPocketMax: '$5,150.00 remaining of $6,500.00 annual out-of-pocket maximum.',
      plainEnglishSummary: `${firstName}'s insurance is active with $850 left on the deductible. For today's PCP visit, collect the $30 copay at check-in. Additional services may apply to the remaining deductible.`,
    },
    fieldAnnotations: [
      { fieldName: 'eligibilityInfo.insuranceInfo.policyStatus', fieldValue: 'Active Policy', plainEnglishLabel: 'Coverage Status', explanation: 'Coverage is active and in good standing. Claims can be submitted normally.', importance: 'HIGH' },
      { fieldName: 'eligibilityInfo.planLevels[0].individual[0].remainingAmount', fieldValue: '850.00', plainEnglishLabel: 'Deductible Remaining', explanation: '$850 of the $1,500 annual deductible remains. The patient has used $650 toward their deductible so far this year. Services beyond the copay will apply to this remaining amount.', importance: 'HIGH' },
      { fieldName: 'eligibilityInfo.planLevels[1].individual[0].remainingAmount', fieldValue: '5150.00', plainEnglishLabel: 'Out-of-Pocket Remaining', explanation: 'The patient has $5,150 remaining before reaching the $6,500 annual out-of-pocket maximum, at which point insurance covers 100%.', importance: 'HIGH' },
      { fieldName: 'serviceLevels[0].individual[0].services[0].message.coPay.subMessages[0].copay', fieldValue: '$30', plainEnglishLabel: 'PCP Visit Copay', explanation: 'The fixed copay amount for a primary care office visit. This is due at check-in.', importance: 'HIGH' },
      { fieldName: 'providerNetwork.status', fieldValue: 'In Network', plainEnglishLabel: 'Network Status', explanation: 'The requesting provider is in-network, which means lower cost-sharing for the patient.', importance: 'MEDIUM' },
      { fieldName: 'eligibilityInfo.insuranceInfo.insuranceType', fieldValue: 'Preferred Provider Organization (PPO)', plainEnglishLabel: 'Plan Type', explanation: 'PPO plans allow the patient to see any provider without a referral, but in-network providers cost less.', importance: 'MEDIUM' },
    ],
    actionItems: [
      { priority: 1, action: `Collect the $30 copay from ${firstName} at check-in.`, reason: 'The PCP office visit has a fixed $30 copay that is due at the time of service.' },
      { priority: 2, action: 'If labs or imaging are ordered, inform the patient that costs will apply toward the $850 remaining deductible at 20% coinsurance.', reason: 'After the copay, additional services are subject to deductible and coinsurance. The patient should know before agreeing to additional services.' },
    ],
    riskFlag: {
      hasRisk: false,
      riskLevel: 'NONE',
      riskSummary: null,
      specificReason: null,
    },
  }
}
