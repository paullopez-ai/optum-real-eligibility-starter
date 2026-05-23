# Your Front Desk Needs Eligibility Answers in Ten Seconds, Not Ten Minutes.

The Optum Eligibility API returns a GraphQL response with deductibles, copays, coinsurance rates, plan levels, service-level benefits, and about forty other fields that nobody at your front desk has time to decode. So I built a starter app that queries the API and hands the raw response to Claude, which translates it into plain English a receptionist can act on in under ten seconds.

This is a walkthrough of the code. Clone the repo, add credentials, and you have a working eligibility verification interface. Or skip the credentials entirely and explore the full UI on mock data first. No API keys required for that.

The repo is at [github.com/paullopez-ai/optum-real-eligibility-starter](https://github.com/paullopez-ai/optum-real-eligibility-starter).

## What You Are Building

A single-page Next.js app that does three things:

1. Authenticates with Optum via OAuth 2.0 (client credentials flow)
2. Sends a GraphQL eligibility query for a patient
3. Passes the raw response to Claude, which returns structured JSON with a coverage summary, patient cost breakdown, action items, and risk flags

The front end renders a split panel. Claude's plain-English annotation on the left, the raw GraphQL JSON on the right. Six synthetic patients cover the scenarios your front desk actually encounters: active coverage, deductible already met, high-deductible HSA plan, terminated COBRA, member not found, and pending enrollment.

Think of it as the Rosetta Stone for insurance eligibility data, except the stone talks back and tells you to collect the $30 copay at check-in.

## The Stack

Next.js 16 with App Router, TypeScript in strict mode, Tailwind CSS v4, shadcn/ui components, and Framer Motion for loading animations. Bun handles package management. The entire app is one API route and one page component backed by a `useReducer` state machine.

## Getting Started in Three Minutes

```bash
git clone https://github.com/paullopez-ai/optum-real-eligibility-starter.git
cd optum-real-eligibility-starter
bun install
cp .env.local.example .env.local
bun dev
```

Open `http://localhost:3000`. That's it. With no API keys configured, the app defaults to mock mode and returns realistic eligibility responses with Claude annotations. Every scenario works. Every panel renders. You can explore the entire UI without spending a dollar or registering anywhere.

When you are ready for real API calls, you need two sets of credentials:

**Optum sandbox credentials** from [marketplace.optum.com](https://marketplace.optum.com/apiservices/api-sandbox-access). You get a client ID and client secret after registering for sandbox access to the Pre-Service Eligibility API.

**Anthropic API key** from [console.anthropic.com](https://console.anthropic.com). The app uses `claude-sonnet-4-6` by default.

Drop them in `.env.local`:

```bash
OPTUM_CLIENT_ID=your_sandbox_client_id
OPTUM_CLIENT_SECRET=your_sandbox_client_secret
OPTUM_AUTH_URL=https://idx.linkhealth.com/auth/realms/developer-platform/protocol/openid-connect/token
OPTUM_ELIGIBILITY_URL=https://sandbox-apigw.optum.com/oihub/eligibility/v1/pre-service/member
OPTUM_PROVIDER_TAX_ID=your_provider_tax_id
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_APP_ENV=sandbox
```

## How the OAuth Flow Works

The first thing that will trip you up is the auth URL. It is *not* at `sandbox-apigw.optum.com`. The working token endpoint lives at a completely different host:

```
https://idx.linkhealth.com/auth/realms/developer-platform/protocol/openid-connect/token
```

The developer portal does not make this obvious. I burned an afternoon figuring that out so you don't have to.

The auth module in `lib/optum-auth.ts` handles token caching with a 60-second safety buffer before expiry. Tokens last one hour. The code requests a new one only when the cached token is about to expire:

```typescript
if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
  return cachedToken.token
}
```

No token management library needed. Just a module-scoped variable and a timestamp check.

## The GraphQL Query (Where the Magic Happens)

The eligibility query in `lib/optum-eligibility.ts` is a beast. Over 170 lines of GraphQL that pulls member info, insurance details, plan-level financials (deductibles, out-of-pocket maximums), service-level benefits (copays, coinsurance per service type), PCP assignment, provider network status, and additional info like HSA eligibility.

The query variables are straightforward:

```typescript
const variables = {
  input: {
    memberId: patient.memberId,
    firstName: patient.subscriberFirstName,
    lastName: patient.subscriberLastName,
    groupNumber: patient.groupNumber,
    dateOfBirth: '1985-03-14',  // Must be YYYY-MM-DD, not YYYYMMDD
    serviceStartDate: today,
    serviceEndDate: today,
    payerId: '87726',
    providerNPI: '1234567890',
    providerFirstName: 'Sample',  // Required non-null field!
    providerLastName: 'Provider',  // Required non-null field!
    serviceLevelCodes: ['30'],     // 30 = general Health Benefit Plan Coverage
  },
}
```

Two gotchas that will cost you time if you miss them:

`providerFirstName` and `providerLastName` are `String!` (non-null) in the GraphQL schema. Omit them and you get a 400 with a message about coerced null values. Placeholder values like "Sample Provider" work fine.

The `providerTaxId` goes in the HTTP headers, not the query variables. Same for `environment: sandbox` and `x-optum-consumer-correlation-id`. The correlation ID is your lifeline if you ever need to call Optum support about a failed request.

## How Claude Annotates the Response

The annotator in `lib/claude-annotator.ts` sends the entire raw eligibility response to Claude with a detailed system prompt. The prompt teaches Claude how to read the Optum GraphQL response structure, what each field means, and how to produce a specific JSON output format.

The output schema includes:

- **Coverage status summary**: one sentence confirming whether the patient is covered
- **Patient responsibility**: deductible remaining, copay, coinsurance percentage, out-of-pocket max, and a plain-English sentence about what the patient will owe today
- **Field annotations**: 4 to 6 key fields from the response with explanations a non-technical reader can understand
- **Action items**: prioritized list of what the front desk should do right now ("Collect the $30 copay at check-in")
- **Risk flag**: HIGH, MEDIUM, or NONE with specific reasoning

The Claude call uses `temperature: 0` for deterministic output and a 45-second timeout. If Claude fails or times out, the app gracefully falls back to showing the raw JSON with an "annotation unavailable" notice. The eligibility data is still accurate; you just lose the translation layer.

This is the Apollo 13 approach to error handling. Failure of one system does not take down the mission.

## The Six Scenarios

The app ships with six synthetic patients in `lib/patients.ts`. Each one triggers a different eligibility scenario:

**Maria Gonzalez (Active Coverage)**: Standard PPO with a partially met deductible. $30 PCP copay, 20% coinsurance, $850 remaining on a $1,500 deductible. This is the happy path.

**James Washington (Deductible Met)**: HMO with the deductible fully satisfied. Only copays and 10% coinsurance apply. The best appointment your billing team will have all day.

**Aisha Rahman (High Deductible/HSA)**: HDHP with $2,800 remaining on a $3,000 deductible. Most services hit the patient at full cost until the deductible is met. HSA-eligible, so ask about the HSA card.

**Robert Chen (Terminated)**: COBRA expired. Policy status shows "Past Policy." No active benefits. The front desk needs to know this before the patient is seen, not after.

**Destiny Williams (Not Found)**: Member ID mismatch. The payer system returns an empty record. Could be a typo on the insurance card, an old card from a previous plan year, or the wrong payer entirely.

**Thomas O'Brien (Pending)**: Medicare Advantage enrollment confirmed but the effective date is in the future. Coverage is real but not yet usable. Services today would be denied.

These scenarios are mock-mode constructs. The Optum sandbox does not have pre-seeded test members for each scenario. It returns generic data regardless of which patient you submit. The mock responses were hand-crafted to demonstrate what a fully working production integration looks like.

## How Mock, Sandbox, and Production Modes Work

Each downstream service independently decides whether to use real APIs or mock data:

| Service | Uses Mocks When | Uses Real API When |
|---------|----------------|-------------------|
| Eligibility | `APP_ENV=development` AND no `OPTUM_CLIENT_ID` | Optum credentials present |
| AI Annotation | `APP_ENV=development` AND no `ANTHROPIC_API_KEY` | Anthropic key present |

This means you can run hybrid configurations. Real Optum data with mock Claude annotations. Mock eligibility data with real Claude analysis. Each service falls back independently based on which keys are present. Like a good band where each musician can improvise without the others falling apart.

## The API Route: Where It All Comes Together

The route handler at `app/api/optum/eligibility/route.ts` is clean. It accepts a POST with a patient object, calls the eligibility service, then calls the Claude annotator, and returns all three pieces (raw response, annotation, timing data) in one response.

```typescript
const rawResponse = await checkEligibility(patient)
const annotation = await annotateEligibility({ patient, eligibilityResponse: rawResponse })
return NextResponse.json({ rawResponse, annotation, durationMs })
```

A 55-second abort timeout wraps the entire handler. The Claude annotation is wrapped in its own try/catch, so even if Claude throws, the raw eligibility data still comes back. The front end handles both cases with different UI states.

## Extending the Starter

**Add more payers**: Change the `payerId` in a patient object. The sandbox uses `87726` for UnitedHealthcare, but the Optum API supports other payer IDs from their documentation.

**Add service type selection**: The `serviceTypeCode` field maps to X12 service codes. `30` is general health benefit, `98` is physician office visit, `86` is emergency, `47` is vision. Wire a dropdown to this field and you get benefit-specific queries.

**Swap Claude for another model**: The annotator is a standard fetch call to the Anthropic Messages API. Replace it with any model that accepts a system prompt and returns structured JSON. The output schema in the system prompt is the contract.

**Add real patients**: The patient list in `lib/patients.ts` is a static TypeScript array. Add objects matching the `SyntheticPatient` interface with the correct field values for your scenario.

## The Sandbox Reality Check

The sandbox validates your authentication flow, query structure, and error handling. It proves your code works end to end. But it returns generic data regardless of which patient you query. The rich, scenario-specific responses with real copay amounts, deductible balances, and service-level breakdowns only come from a production Optum account with real provider credentials.

Think of the sandbox as the dress rehearsal where everyone knows their lines but the props are all cardboard.

## Quick Start Checklist

1. Register at [marketplace.optum.com](https://marketplace.optum.com)
2. Subscribe to sandbox access for the Eligibility API
3. Get your `client_id` and `client_secret`
4. Clone the repo and run `bun install`
5. Copy `.env.local.example` to `.env.local` and add your credentials
6. Run `bun dev` and open `http://localhost:3000`
7. Pick a patient, click "Check Eligibility," and watch the split panel render
8. Read the code in `lib/optum-eligibility.ts` to understand the GraphQL query
9. Read `lib/claude-annotator.ts` to see how the AI annotation works
10. Modify a patient, add a service type, or swap the AI model

The repo is MIT licensed and designed to be forked. The entire point is to give you a working reference so you spend your time building features, not debugging OAuth endpoints and GraphQL schema validation errors.

---

*Built by [Paul Lopez](https://paullopez.ai) as a reference implementation for healthcare developers working with the Optum Eligibility API.*
