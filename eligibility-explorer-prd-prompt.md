# PRD Generation Prompt
## Optum Real API — Eligibility Explorer
## Paul Lopez / Skygile Research LLC
### Paste this entire prompt into Claude Code or a new Claude.ai session to generate the full PRD

---

You are a senior product engineer and technical architect helping Paul Lopez, Sr. Director of Technology Architecture at Optum and founder of Skygile Research LLC, generate a comprehensive Product Requirements Document (PRD) for a standalone healthcare API proof-of-concept application called the **Eligibility Explorer**.

---

## ABOUT PAUL AND THE PROJECT PURPOSE

Paul is building a suite of standalone proof-of-concept applications that demonstrate real-world applications of the Optum Real API suite. Each POC is its own independent GitHub repository, its own Vercel deployment, and its own companion blog post and LinkedIn article.

These POCs serve three simultaneous purposes:

1. **Technical portfolio:** Published on GitHub under both `paullopez-ai` and `skygile` organizations simultaneously via a dual-push Git workflow. Each repo has its own README written for a different audience. Each POC links to a companion post on blog.paullopez.ai.

2. **Consulting evidence:** Each demo is a live artifact Paul shows to healthcare executives, CIOs, and revenue cycle leaders when pitching Skygile's Healthcare AI Advisory practice. The demo must tell a compelling story in under three minutes without explanation.

3. **SKILLS-AI product seed:** The Claude layer in each POC is designed from day one to be extracted and packaged as a composable SKILL.md file under the Anthropic Agent Skills standard — a productized, agent-callable knowledge package sold through Skygile's SKILLS-AI product line.

Every decision in this PRD must serve all three audiences simultaneously: the developer reading the GitHub README, the healthcare executive watching the live demo, and the future AI agent consuming the extracted skill.

---

## THIS APPLICATION: ELIGIBILITY EXPLORER

**Project Name:** Eligibility Explorer
**GitHub Repo Name:** `optum-eligibility-explorer`
**GitHub Organizations:** `paullopez-ai` and `skygile` (dual-push)
**Vercel Deployment URL:** `eligibility-explorer.paullopez.ai` (primary) and `eligibility-explorer.skygile.ai` (mirror)
**Optum API Used:** Real Pre-Service Eligibility API
**Optum Dev Documentation Search Throughout:**

https://developer.optum.com/
https://developer.optum.com/optumreal-medical/reference/what-is-an-api-and-why-does-it-matter-in-your-office-1
https://developer.optum.com/eligibilityandclaims/reference/api-overview
https://developer.optum.com/apitools/reference/security-and-authorization-v2-overview

**POC Tier:** Tier 3 — Quick Win (builds sandbox fluency, fastest path to a published demo)
**Companion Blog Post:** To be published on blog.paullopez.ai
**Build Timeline:** 1 focused week, 2-3 hour sessions

### What This Application Does

The Eligibility Explorer is a polished interactive UI that wraps the Optum Real Pre-Service Eligibility API. It takes a synthetic patient scenario as input, calls the Optum sandbox API, receives a 271 response, and renders the raw JSON alongside a Claude-generated plain-English annotation of every significant field. Every field in the eligibility response is labeled with a plain-English explanation of what it means clinically and administratively.

The primary insight the demo makes tangible: the raw 271 response is technically complete and practically unreadable to the front-desk staff who need it most. The Claude layer bridges that gap — not by hiding the data, but by making it human alongside the machine.

### The Healthcare Problem This Addresses

Prior to a patient visit, providers must verify insurance eligibility. The 270/271 ANSI X12 transaction set is the industry standard — and it is nearly incomprehensible to non-technical staff. Fields like `serviceTypeCode`, `insuranceTypeCode`, `benefitAmount`, and nested `planStatus` arrays require significant expertise to parse correctly. Staff either skip the check (risking denials) or call the payer directly (wasting 15-20 minutes per patient). This demo shows what real-time eligibility verification looks like when the response is made human-readable instantly and automatically.

---

## PAUL'S TECHNICAL STACK — NON-NEGOTIABLE, DO NOT DEVIATE

This application is bootstrapped using Paul's standard Next.js bootstrap command. The PRD must specify all components, patterns, and architecture choices that are idiomatic to this exact stack. Do not suggest alternatives or "you could also use" options — specify what will be built.

### Framework and Tooling
- **Framework:** Next.js 16+ with App Router (no Pages Router)
- **Language:** TypeScript (strict mode, no `any` types)
- **Package Manager:** Bun (not npm, not yarn, not pnpm)
- **Build:** Turbopack
- **Linting:** ESLint

### UI and Styling
- **CSS Framework:** Tailwind CSS v4
- **Component Library:** shadcn/ui (style: `base-vega`, base color: `zinc`, CSS variables: true)
- **Icon Library:** Hugeicons (`@hugeicons/react` and `@hugeicons/core-free-icons`)
- **Animation:** Framer Motion (`framer-motion`) and `tw-animate-css`
- **Theme System:** `next-themes` — light/dark mode toggle using `ThemeToggle` component with `Sun03Icon` / `Moon02Icon` from Hugeicons
- **Radius Convention:** Sharp corners everywhere. `--radius: 0` in globals.css. No rounded corners unless a specific clinical reason is documented.
- **Color System:** OKLCH tokens only. No hex values in component code — use CSS variables.

### Typography
- **Display Font:** Playfair Display — use `font-display` Tailwind class. Used for page title, section headers, patient name display.
- **Sans Font:** Raleway — default body font, navigation, labels, button text.
- **Mono Font:** Geist Mono — all API response data, JSON display, field values, codes, timestamps. This is critical for the raw response panel.

### Brand Color Palette (OKLCH — use these exact values in globals.css)
```css
--primary: oklch(0.59 0.14 242)           /* Brand Blue  — #2176C7  — primary actions, links, active states */
--brand: oklch(0.65 0.19 45)              /* Accent Amber — #E59F54 — CTAs, highlights, key data callouts */
--brand-secondary: oklch(0.62 0.21 295)   /* Innovation Purple — #9F60FF — AI/Claude layer indicators */
--background-light: oklch(0.97 0.01 240)  /* Light BG — #F4F9FE — article backgrounds */
--background-dark: oklch(0.18 0.02 260)   /* Dark BG — #131A21 — landing, hero, demo default */
```

The purple (`--brand-secondary`) is used exclusively for everything the Claude layer produces. This creates a consistent visual language: blue is Optum data, purple is Claude's interpretation. The viewer learns this pattern immediately without being told.

### Pre-installed shadcn Components (from bootstrap — use these, do not reinstall)
`alert`, `alert-dialog`, `badge`, `button`, `card`, `combobox`, `dropdown-menu`, `input`, `label`, `scroll-area`, `select`, `separator`, `textarea`, `field`

Additional components needed for this POC must be specified with the exact `bunx shadcn@latest add [component]` command.

### Pre-installed Dependencies (from bootstrap)
- `@base-ui/react`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `framer-motion`
- `tw-animate-css`
- `next-themes`

Additional dependencies needed for this POC must be specified with exact package names and bun install commands.

---

## OPTUM API INTEGRATION ARCHITECTURE

### Security First — No Credentials in the Browser

The Optum Security & Authorization API v3 uses OAuth 2.0 client credentials grant. The `client_id` and `client_secret` are stored in `.env.local` and accessed only in Next.js Route Handlers (server-side). The browser never sees them. This is non-negotiable.

### Request Flow
```
Browser (React component)
  ↓ fetch('/api/optum/eligibility', { method: 'POST', body: patientScenario })
    ↓ Next.js Route Handler — app/api/optum/eligibility/route.ts (server-side)
      ↓ POST https://[optum-auth-url]/apip/auth/sntl/v1/token
        ← Bearer token (short-lived, cache in module scope for token lifetime)
      ↓ POST https://[optum-api-url]/eligibility (with Bearer token)
        ← 271 eligibility response (JSON)
      ↓ POST https://api.anthropic.com/v1/messages (with eligibility response + patient context)
        ← Claude structured annotation (JSON)
    ← { rawResponse: EligibilityResponse, annotation: ClaudeAnnotation, patient: PatientContext }
  ↓ React component renders dual-panel UI
```

### Token Caching Strategy
The Optum Bearer token is short-lived. The Route Handler must implement in-memory token caching: store the token and its expiry time in module scope, check expiry before each API call, re-fetch only when expired or within a 60-second buffer. This prevents unnecessary token requests on every eligibility check.

### Sandbox Behavior — Critical Constraints
The Optum sandbox does not accept real or invented patient data. It returns canned responses based on the `tradingPartnerServiceId` field in the request. The PRD must:
- Specify exactly which predefined Payer IDs this application uses
- Map each Payer ID to the sandbox scenario it triggers
- Map each synthetic patient persona to a Payer ID
- Document the 270 request payload field values that satisfy the sandbox validation

---

## DATA ARCHITECTURE — SYNTHETIC PATIENT PERSONAS

### Why Synthetic Patients

The sandbox does not validate patient data — it matches on `tradingPartnerServiceId` to return canned responses. This means the application can present rich, realistic patient narratives in the UI while the underlying API call uses valid sandbox values. The synthetic patient layer is what makes the demo feel like a real clinical tool rather than an API tester.

### Storage

Patient personas are stored as a typed TypeScript array in `lib/patients.ts` — a static data file, not a database. For this POC's scope (6-8 patients, read-only), a database adds unnecessary complexity. The file exports a typed array that both the UI (for the patient selector) and the Route Handler (for narrative context) can import directly.

### Patient Schema
```typescript
interface SyntheticPatient {
  id: string                        // e.g., 'patient-001'
  firstName: string
  lastName: string
  dateOfBirth: string               // 'YYYY-MM-DD' format
  memberId: string                  // Valid sandbox subscriber memberId value
  groupNumber: string               // Valid sandbox group number value
  tradingPartnerServiceId: string   // Controls which canned response is returned
  insurancePlan: string             // Display label — e.g., 'UHC Gold PPO 2024'
  primaryCareProvider: string       // Display only — e.g., 'Dr. Sarah Chen, MD'
  scenario: EligibilityScenario    // Enum value — drives UI messaging
  scenarioLabel: string             // Human-readable scenario name for the selector
  narrativeContext: string          // 2-3 sentence description Claude uses for storytelling
  // Optum 270 request fields — pre-populated, valid sandbox values
  subscriberFirstName: string
  subscriberLastName: string
  subscriberDob: string
  npi: string                       // Provider NPI — valid sandbox value
  serviceTypeCode: string           // e.g., '30' (Health Benefit Plan Coverage)
}

type EligibilityScenario =
  | 'ELIGIBLE_ACTIVE'               // Patient is fully covered, deductible not met
  | 'ELIGIBLE_DEDUCTIBLE_MET'       // Patient is covered, deductible fully met
  | 'ELIGIBLE_HIGH_COPAY'           // Patient is covered, high out-of-pocket exposure
  | 'INELIGIBLE_TERMED'             // Coverage terminated
  | 'INELIGIBLE_NOT_FOUND'          // Member ID not found
  | 'ELIGIBLE_PENDING'              // Coverage pending verification
```

### Required Patient Personas
The PRD must define a minimum of 6 and maximum of 8 synthetic patient personas. Each must represent a clinically and administratively distinct scenario that a front-desk staff member would actually encounter. Personas should feel like real people with context — not test cases. The PRD must include the full data object for each persona including all Optum sandbox field values.

---

## CLAUDE LAYER SPECIFICATION

### Purpose

The raw 271 eligibility response from Optum is technically complete. It contains everything a billing system needs. It contains almost nothing a front-desk coordinator can act on in 30 seconds. The Claude layer does not summarize or replace the raw data — it annotates it. Both are displayed. The human reads Claude's plain-English interpretation; the technical user can inspect the raw JSON. The purple color convention (brand-secondary) visually separates Claude's output from Optum's output throughout the UI.

### What Claude Annotates

For each eligibility response, Claude produces:

1. **Coverage Status Summary** — One plain-English sentence stating whether the patient is covered and for what.
2. **Patient Responsibility Estimate** — Plain-English breakdown of deductible remaining, copay, and coinsurance in terms a patient can understand if read aloud to them.
3. **Field Annotations** — For each significant field in the 271 response, a one-sentence plain-English explanation of what the field means and why it matters to the front desk.
4. **Action Items** — A prioritized list of 2-3 things the front-desk staff should do before or during the visit based on this eligibility result.
5. **Risk Flag** — If the eligibility result signals a high denial risk (termed coverage, deductible not met for a high-cost procedure, out-of-network indicators), Claude surfaces a specific plain-English warning with the reason.

### Claude API Configuration
- **Model:** `claude-sonnet-4-6`
- **Max tokens:** 1200
- **Temperature:** 0 (deterministic — this is clinical annotation, not creative generation)
- **Streaming:** No — batch response. The eligibility check and Claude annotation complete together before the UI updates. The loading state covers both operations.
- **Timeout:** 25 seconds total for the Route Handler (eligibility call + Claude call combined)

### System Prompt Intent
The system prompt establishes Claude as an expert healthcare eligibility analyst and patient advocate. Claude knows the 270/271 transaction set, understands how front-desk workflows actually function, and writes in plain English that a non-clinical administrative professional can act on immediately. Claude never uses clinical jargon without explaining it. Claude's output is always structured JSON — never prose.

### Input to Claude (from Route Handler)
```typescript
interface ClaudeEligibilityInput {
  patient: {
    firstName: string
    lastName: string
    insurancePlan: string
    narrativeContext: string
    scenario: EligibilityScenario
  }
  eligibilityResponse: EligibilityResponse    // Full 271 JSON from Optum
  requestedServiceType: string                // e.g., 'routine office visit'
}
```

### Required Output from Claude (typed, parseable JSON)
```typescript
interface ClaudeEligibilityAnnotation {
  coverageStatusSummary: string               // One plain-English sentence
  patientResponsibility: {
    deductibleRemaining: string               // e.g., '$850 remaining of $1,500 annual deductible'
    copay: string                             // e.g., '$30 copay for primary care visits'
    coinsurance: string                       // e.g., '20% after deductible'
    outOfPocketMax: string                    // e.g., '$4,500 remaining before full coverage'
    plainEnglishSummary: string              // One sentence a staff member could read to the patient
  }
  fieldAnnotations: Array<{
    fieldName: string                         // Exact JSON field name from 271 response
    fieldValue: string                        // The actual value
    plainEnglishLabel: string                 // Human-readable field name
    explanation: string                       // One sentence explaining what this means
    importance: 'HIGH' | 'MEDIUM' | 'LOW'   // Drives visual prominence in UI
  }>
  actionItems: Array<{
    priority: 1 | 2 | 3
    action: string                            // Specific thing for staff to do
    reason: string                            // Why this action matters
  }>
  riskFlag: {
    hasRisk: boolean
    riskLevel: 'HIGH' | 'MEDIUM' | 'NONE'
    riskSummary: string | null               // null if no risk
    specificReason: string | null            // null if no risk
  }
  sandboxNote: string    // Transparent disclosure: 'This response is based on Optum sandbox data'
}
```

### Fallback Behavior
If the Claude API call fails or times out, the Route Handler returns the raw Optum eligibility response without annotation. The UI renders the raw JSON panel with a badge reading "AI annotation unavailable — showing raw eligibility data." The demo remains functional. The Claude panel shows a muted alert explaining the fallback. This is documented in the README as expected behavior during Claude API outages.

---

## UI/UX SPECIFICATION — DEMO NARRATIVE

### The Three-Minute Demo Script

The UI is designed around a specific three-minute live demo flow. Every design decision serves this script:

**Minute 0:00-0:30 — Arrival**
Page loads in dark mode. The header reads "Eligibility Explorer" in Playfair Display. A subtitle in Raleway reads "What does real-time insurance verification actually look like?" A patient selector (shadcn `select` or `combobox`) is prominent. Six patient cards are visible below it, each showing name, insurance plan, and scenario badge.

**Minute 0:30-1:00 — Patient Selection**
Paul selects a patient — e.g., "Maria Gonzalez, UHC Gold PPO, Deductible Met." The patient card expands with narrative context. A "Check Eligibility" button in Brand Blue becomes active.

**Minute 1:00-1:30 — The API Call**
Paul clicks "Check Eligibility." A loading state shows two sequential steps with Framer Motion: "Verifying coverage with UnitedHealthcare..." then "Interpreting results..." Each step has a subtle animated indicator. This visible two-step loading communicates that two real things are happening — the Optum API call and the Claude annotation.

**Minute 1:30-3:00 — The Result**
The result panel animates in with a split layout:

- **Left panel (60% width):** Claude's annotation in purple-accented cards. Coverage status at top in large type. Patient responsibility breakdown. Action items as a prioritized checklist. Risk flag (if any) in amber.
- **Right panel (40% width):** Raw 271 JSON in Geist Mono, dark background, collapsible sections. A "View Raw API Response" toggle expands/collapses it. Field annotations appear as purple tooltip-style overlays on the raw JSON fields when hovered.

The split panel layout is the core UX insight: the demo does not hide the raw API response. It shows both simultaneously. This is what makes it credible to a developer and comprehensible to an executive in the same three minutes.

### Page Architecture (App Router)
```
app/
  layout.tsx            — Root layout, ThemeProvider, fonts (Playfair Display, Raleway, Geist Mono via next/font)
  page.tsx              — Main application page (single page, no sub-routes needed)
  globals.css           — Paul's bootstrap CSS with brand OKLCH tokens added
  api/
    optum/
      eligibility/
        route.ts        — POST handler: token exchange → eligibility API → Claude annotation
```

### Component Architecture
```
components/
  theme-provider.tsx           — From bootstrap (do not modify)
  theme-toggle.tsx             — From bootstrap (do not modify)
  patient-selector.tsx         — shadcn Select/Combobox wrapping patient list
  patient-card.tsx             — Individual patient display with scenario badge
  eligibility-check-button.tsx — Primary CTA with loading state
  result-panel.tsx             — Parent container for split layout
  claude-annotation-panel.tsx  — Left panel: all Claude output (purple convention)
  coverage-summary.tsx         — Hero coverage status from Claude
  responsibility-breakdown.tsx — Deductible/copay/coinsurance cards
  action-items.tsx             — Prioritized checklist component
  risk-flag.tsx                — Conditional amber warning component
  raw-response-panel.tsx       — Right panel: raw JSON with syntax highlighting
  field-annotation-tooltip.tsx — Purple tooltip overlays on JSON fields
  loading-sequence.tsx         — Two-step animated loading indicator
  sandbox-disclosure.tsx       — Persistent footer: sandbox data notice
```

### State Management
No external state library. React `useState` and `useReducer` only. The application has one primary state machine:

```typescript
type AppState =
  | { status: 'idle' }
  | { status: 'selected'; patient: SyntheticPatient }
  | { status: 'loading'; patient: SyntheticPatient; step: 'eligibility' | 'annotation' }
  | { status: 'success'; patient: SyntheticPatient; result: EligibilityResult }
  | { status: 'error'; patient: SyntheticPatient; error: string }
  | { status: 'fallback'; patient: SyntheticPatient; rawResponse: EligibilityResponse }

interface EligibilityResult {
  rawResponse: EligibilityResponse
  annotation: ClaudeEligibilityAnnotation
  durationMs: { eligibility: number; annotation: number }   // For performance display
}
```

### Performance Display
The result panel shows two small timing badges: "Eligibility: 340ms" and "AI annotation: 1.2s" in Geist Mono. This is intentional. It makes the point that real-time eligibility verification is genuinely fast — the bottleneck is never the API. This supports the core thesis of Paul's Optum Real article series.

---

## PROJECT FILE STRUCTURE

The PRD must specify a complete file tree for the standalone project with a one-line description of every file's purpose. The root is `optum-eligibility-explorer/`.

```
optum-eligibility-explorer/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       └── optum/
│           └── eligibility/
│               └── route.ts
├── components/
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── [all components listed above]
├── lib/
│   ├── optum-auth.ts          — Token exchange and in-memory caching
│   ├── optum-eligibility.ts   — Typed wrapper for the eligibility API call
│   ├── claude-annotator.ts    — Claude API call, prompt template, response parsing
│   └── patients.ts            — Synthetic patient personas (static typed array)
├── types/
│   ├── optum.types.ts         — 270 request and 271 response TypeScript interfaces
│   ├── patient.types.ts       — SyntheticPatient and EligibilityScenario types
│   └── claude.types.ts        — ClaudeEligibilityInput and ClaudeEligibilityAnnotation types
├── skills/
│   └── eligibility-interpreter.skill.md    — SKILLS-AI extraction draft
├── public/
│   └── [any static assets]
├── .env.local.example
├── .env.local                 — gitignored
├── .gitignore
├── components.json            — shadcn config (Paul's bootstrap values)
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md                  — Single README, dual content strategy documented inside
```

---

## ENVIRONMENT VARIABLES

The PRD must produce a complete `.env.local.example` with every variable, a description, and instructions for obtaining the value:

```bash
# Optum API — Sandbox Credentials
# Obtain by registering at: https://marketplace.optum.com/apiservices/api-sandbox-access
OPTUM_CLIENT_ID=your_sandbox_client_id_here
OPTUM_CLIENT_SECRET=your_sandbox_client_secret_here
OPTUM_AUTH_URL=https://[optum-auth-endpoint]/apip/auth/sntl/v1/token
OPTUM_ELIGIBILITY_URL=https://[optum-api-endpoint]/eligibility

# Anthropic Claude API
# Obtain at: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application
NEXT_PUBLIC_APP_ENV=sandbox     # 'sandbox' | 'production'
```

---

## GITHUB DUAL-PUSH STRATEGY

The project is pushed to two GitHub organizations simultaneously. The PRD must specify the Git remote configuration and the README strategy.

### Git Remote Configuration
```bash
git remote add paullopez git@github.com:paullopez-ai/optum-eligibility-explorer.git
git remote add skygile git@github.com:skygile/optum-eligibility-explorer.git

# Push alias (add to .gitconfig or document as npm script)
# git push paullopez main && git push skygile main
```

### README Strategy
A single `README.md` file serves both organizations. It opens with the developer narrative (paullopez-ai audience) and includes a clearly marked "## For Healthcare Organizations" section (skygile audience). The PRD must write both sections in full, following myVoice.md guidelines: clever title, at least one witty observation, no em dashes, data-driven, direct and authoritative.

---

## SKILLS-AI EXTRACTION PLAN

### What Gets Extracted

The Claude layer in this POC — specifically the system prompt, the field annotation logic, the patient responsibility interpretation, and the action item generation — becomes the `eligibility-interpreter` SKILLS-AI package. The Optum API integration, the synthetic patient data, and the UI rendering stay in the POC. The skill is the judgment layer, not the plumbing.

### Skill Identity
- **Skill Name:** `eligibility-interpreter`
- **File:** `eligibility-interpreter.skill.md`
- **Category:** Healthcare Revenue Cycle
- **Target Agent Types:** Healthcare administrative AI agents, revenue cycle automation agents, patient financial counseling agents

### Input/Output Contract
```typescript
// What an AI agent provides when invoking this skill
interface EligibilityInterpreterInput {
  eligibilityResponse: object         // Raw 270/271 response from any eligibility API
  patientContext: {
    firstName: string
    lastName: string
    insurancePlan?: string
    plannedService?: string           // What service the patient is coming in for
  }
  outputFormat: 'structured' | 'narrative'
}

// What the skill returns to the agent
interface EligibilityInterpreterOutput {
  coverageStatusSummary: string
  patientResponsibility: object
  actionItems: Array<{ priority: number; action: string; reason: string }>
  riskFlag: { hasRisk: boolean; riskLevel: string; summary: string | null }
  fieldAnnotations: Array<{ field: string; explanation: string; importance: string }>
}
```

### SKILL.md Draft
The PRD must produce a complete, ready-to-use `eligibility-interpreter.skill.md` following the Anthropic Agent Skills standard, including frontmatter, purpose, use cases, full system prompt (as it would appear in the skill), input schema, output schema, and one worked example.

### Productization Path
- **Phase 1 (Now):** Embedded in the Eligibility Explorer POC as `claude-annotator.ts`
- **Phase 2 (Post-departure):** Extracted to `eligibility-interpreter.skill.md`, packaged as a standalone Skygile SKILLS-AI product
- **Pricing:** $2,500 standalone purchase or $800/month subscription with quarterly updates for payer rule changes
- **Target Buyer:** Health systems, medical groups, and revenue cycle management vendors who want to add AI interpretation to their existing eligibility workflows without building the prompt engineering from scratch

---

## CONTENT AND PUBLICATION PLAN

### Blog Post (blog.paullopez.ai)

The PRD must produce:

- **Title:** Following myVoice.md — clever, witty, no em dashes, no buzzwords. Hint: the 270/271 transaction set has been around since 1996. There is humor in that.
- **Subheadline:** One sentence explaining the technical demonstration and its human payoff
- **Opening hook:** A specific statistic about eligibility verification time, denial rates, or administrative burden (cite a real source)
- **Article outline:** 6-8 H2 sections covering the problem, the API, the Claude layer, what the demo shows, key learnings, and a forward-looking close
- **The witty observation:** The one line that makes the reader smile and remember the post
- **Cultural reference:** One reference from myVoice.md's approved list (music, TV, tech nostalgia) — used once, purposefully
- **CTA:** Links to the live demo, the GitHub repo (paullopez-ai version), and Skygile Healthcare AI Advisory

### LinkedIn Post (not article — post format)
The PRD must produce a ready-to-publish LinkedIn post following myVoice.md formatting rules:
- Plain text only (no markdown)
- Bold/heavy arrows from the approved list (➡, ➔, ➤) for structure
- Maximum 3,000 characters
- First 200 characters are the hook (appears before "see more")
- Announces the live demo with a link
- Ends with a CTA that drives either GitHub traffic or Skygile inquiry

---

## TESTING AND VALIDATION

### Sandbox Scenario Coverage Matrix
The PRD must produce a complete matrix:

| Patient Persona | Payer ID | Sandbox Scenario | Expected 271 Outcome | UI Behavior |
|----------------|----------|------------------|---------------------|-------------|
| (fill for each of 6-8 patients) | | | | |

### Claude Output Validation Checklist
The PRD must specify the exact manual review process for validating Claude output quality:
- Does the coverage summary match the scenario?
- Are field annotations accurate for a 271 response?
- Are action items specific and actionable (not generic)?
- Is the risk flag correctly triggered/suppressed for each scenario?
- Is the patient responsibility breakdown mathematically consistent?
- Does the output parse as valid JSON without errors?

### Demo Rehearsal Checklist
Step-by-step pre-demo checklist Paul runs before any live demo, screen recording, or LinkedIn video:

1. Confirm `.env.local` is populated with valid sandbox credentials
2. Run `bun dev` and confirm no TypeScript errors
3. Test each of the 6-8 patient personas end-to-end
4. Confirm dark mode is set as default
5. Confirm browser zoom is at 100% for screen recording
6. Confirm both loading steps animate correctly
7. Confirm raw JSON panel collapses and expands correctly
8. Confirm timing badges display realistic values
9. Confirm sandbox disclosure footer is visible
10. Confirm fallback behavior works by temporarily removing `ANTHROPIC_API_KEY`

---

## IMPLEMENTATION SEQUENCE

The PRD must expand each session below into a specific, ordered task list. Assume 2-3 hours per session. Sessions must be sequenced so that each ends with something testable.

- **Session 1:** Project bootstrap (Paul's bootstrap command), environment setup, `.env.local` configuration, confirm Next.js runs cleanly
- **Session 2:** Type definitions (`optum.types.ts`, `patient.types.ts`, `claude.types.ts`), Optum auth module with token caching (`optum-auth.ts`), unit test the token exchange against the sandbox
- **Session 3:** Eligibility API wrapper (`optum-eligibility.ts`), Route Handler (`route.ts`) with auth + API call, Postman or curl test with each patient's Payer ID to confirm canned responses return correctly
- **Session 4:** Claude annotator module (`claude-annotator.ts`), prompt engineering and iteration, validate structured JSON output for each scenario, confirm fallback behavior
- **Session 5:** Patient data file (`patients.ts`) with all 6-8 personas fully populated, patient selector component, patient card component, base page layout
- **Session 6:** Loading sequence component, result panel split layout, Claude annotation panel with all sub-components, raw response panel with syntax highlighting
- **Session 7:** Brand application (OKLCH tokens, purple convention for Claude output, amber for risk flags), dark mode polish, Framer Motion animations, timing badges, performance display
- **Session 8:** `eligibility-interpreter.skill.md` draft, README writing (both audiences), sandbox disclosure, final TypeScript strict-mode compliance check
- **Session 9:** GitHub dual-push setup, Vercel deployment, DNS configuration for `eligibility-explorer.paullopez.ai`, demo rehearsal checklist run-through, blog post draft

---

## FUTURE EXTENSIONS (OUT OF SCOPE FOR V1)

The PRD must document these as a backlog, not as v1 requirements:
- Add `serviceTypeCode` selector so the user can request different benefit types (dental, vision, mental health)
- Add payer comparison mode: run the same patient through two different Payer IDs and compare the responses side by side
- Export Claude annotation as a PDF patient-facing summary
- Add a "what changed" feature that compares two eligibility checks for the same patient over time
- Connect to Real Patient Benefit Check API for more granular benefit detail
- Build a SKILLS-AI packaging UI that exports the `claude-annotator.ts` prompt template as a `SKILL.md` file directly from the app

---

## FINAL INSTRUCTIONS TO CLAUDE

Generate this PRD completely. Do not abbreviate any section. Do not write "see above" or "as mentioned" — each section must be self-contained and complete.

Every architectural decision must be made explicitly. Do not write "you may want to consider" — state what will be built and how. If a decision requires a trade-off, name the trade-off and state the chosen approach with the reason.

All TypeScript interfaces must be complete — no `// add more fields as needed` shortcuts.

The synthetic patient personas must be fully populated with realistic names, narratives, and all required Optum sandbox field values. Make them feel like real people, not test fixtures.

The system prompt for Claude in Section 7 must be written in full — not described, not summarized. Write the actual prompt text that will appear in `claude-annotator.ts`.

The blog post outline must follow myVoice.md guidelines precisely: clever title with wordplay or cultural reference, at least one witty observation, no em dashes anywhere, specific data hook, direct authoritative voice, no corporate buzzwords.

When the PRD is complete, append a section titled **CLAUDE CODE KICKOFF PROMPT** containing a ready-to-paste prompt Paul can use in Claude Code to begin Session 1. The kickoff prompt must: reference Paul's bootstrap command by name, specify the project folder name as `optum-eligibility-explorer`, list the first five files to create after bootstrapping in order, and include the complete `.env.local.example` content.

---

*PRD Prompt v1.0 — Eligibility Explorer*
*Paul Lopez / Skygile Research LLC — February 2026*
*Stack reference: pauls-bootstrap.md*
*Brand reference: paul-lopez-brand-card.md*
*Voice reference: myVoice.md*
*Business context: paul-lopez-career-transition-master-plan.md*
*API reference: developer.optum.com/optumreal-medical/reference*
