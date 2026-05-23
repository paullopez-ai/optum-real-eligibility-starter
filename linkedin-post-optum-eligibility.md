your front desk verifies insurance eligibility 50 times a day.

the response comes back as a GraphQL blob with 40+ nested fields. 💡

deductibles, coinsurance percentages, service-level copays, plan levels, OOP maximums, policy status flags.

good luck explaining that to a receptionist between patients.

so I built a starter app that does something simple:

→ queries the Optum Eligibility API via GraphQL
→ hands the raw response to Claude
→ gets back plain English a front-desk staffer can act on in seconds

"collect the $30 copay at check-in."
"coverage terminated on 10/15. ask about new insurance."
"HDHP with $2,800 remaining on the deductible. check for HSA card."

the whole thing is open source. 🚀

Next.js, TypeScript, OAuth 2.0 token caching, six patient scenarios covering everything from active PPO to terminated COBRA.

no API keys needed to explore. mock mode runs the full UI out of the box.

new article on paullopez.ai walks through the source code, the GraphQL query, the sandbox gotchas that will cost you an afternoon, and how Claude turns eligibility data into action items.

link in comments 👇
