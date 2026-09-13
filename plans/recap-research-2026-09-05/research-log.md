# Research scope and progress

Decision: sharpen Pictify's proposed B2B SaaS customer milestone/ROI media wedge using the actual redesign-v2 implementation and current primary market evidence. Deliver a revised Markdown strategy and executable product/validation plan. Product changes may be recommended; this research does not implement or deploy them.

Assumptions: founder-led English-language B2B acquisition, no paid acquisition budget, 20 GTM hours per week from the original plan. Engineering availability remains unspecified and will be estimated separately. Geography is not used to assert a legal compliance status. Prices will retain the vendor's displayed currency and billing basis.

Source classes: current frontend/backend and integration code; first-party campaign examples; renderer, customer-success and reporting competitor product/docs/pricing pages; lifecycle-platform integration documentation. Vendor outcome claims remain vendor claims. No private customer data or paid production renders are needed.

The session has no callable update_plan tool; progress is recorded here instead.

## Steps

1. Complete: discover current implementation, alternative solutions, and buyer/campaign evidence.
2. Complete: close material gaps in data handoff, recipient delivery, economics, and wedge selection.
3. Complete: synthesize the revised plan, requirements, gates, and source ledger.
4. Complete: verify citations, calculations, internal consistency, file links, and deliverable.

## Initial gap matrix

| Decision claim | Initial evidence | Missing/disconfirming evidence | Follow-up |
|---|---|---|---|
| Recaps deserve a specialized workflow | Annual Gorgias claim and weekly Grain example in Customer.io guide | Paid demand for Pictify, current owner, comparable recurring B2B campaigns | Original campaign/provider examples and buyer interview design |
| Multi-format rendering differentiates | Pictify editor/API code | Placid/Creatomate already offer similar formats | Compare complete workflow and higher-level reporting substitutes |
| Product is near pilot-ready | Redesign-v2 has CSV mapping, video and run UI | ID join, durable retries, output export, actual server limits | Separate frontend/backend code audits |
| Data is easy to provide | CSV and lifecycle platform assumed | Account/user identity, metric derivation, permissions | Define minimal account data contract and actual ESP handoff |
| Service prices support a product | Proposed $300/$500 proofs | Founder effort, repeat cost, setup versus usage value | Sensitivity arithmetic and explicit margin accounting |
| Paid repeats prove recurrence | Original 45-day rule | Quarterly cadence contradicts test | Cohort-specific repeat due dates and independent buyer replication |

## Discovery notes

- Frontend worktrees identified with git worktree list. Primary: `.claude/worktrees/redesign-v2`, HEAD 008962d, includes uncommitted changes. Separate dashboard-redesign is older and not the basis of this plan.
- Backend located at `/Users/suyashthakur/Developer/Personal/html-to-gif`, HEAD ada2883. This is local implementation evidence, not proof of what is deployed.
- Delegated independent frontend, backend, and competitor audits under the deep-research skill. Coordinator owns evidence reconciliation and the final plan.
- Google searches for campaign and value-reporting evidence hit CAPTCHA; DuckDuckGo also challenged. One Bing query returned irrelevant results. Do not treat those as evidence of absent demand. Continue through primary sites and their internal links.
- Shared gstack browser restarted unexpectedly during concurrent use. Research was serialized and page identity checked before extracting evidence.

## Follow-up and stopping decision

- User confirmed about 40 engineering hours/week in addition to the prior 20 GTM hours. Current paid/repeat-user evidence was requested but not supplied; remain explicit that it is unknown.
- Three read-only audits completed. Coordinator spot-checked Run schema, video row cap, setImmediate orchestration, queue timeout/retries, public caching code, and frontend previews/run-to-hook format omission.
- Synthetic parser checks reproduced silent duplicate-header overwrite, accepted duplicate customer IDs, and accepted unclosed quotes. Zero and blank remain distinct strings. No customer data, production renders, or outbound messages were used.
- Verified primary market sources: Matik Digital CS and Modern Health case (2023), plus Okta monthly value-snapshot case (June 15, 2026). The Okta case discloses a customer discount for participation; engagement/renewal association is not causal proof.
- Verified Customer.io object/relationship docs, webhook action docs (16-second timeout, provider idempotency header, retries, signature), reporting event definitions, and email image guidance.
- Reconciled annual/year-in-review examples: Userlist's article mixes personalized customer summaries with generic product/company newsletters, so example counts are not a count of demand for this exact product.
- Reviewed closest alternatives: Matik, ChurnZero, Qwilr, Placid/Creatomate, existing ESP templates; Cuvama/Gainsight used only to define adjacent scope. Matik pricing and Gainsight snapshot support inaccessible; no claims fabricated from them.
- Stop external retrieval: all consequential plan sections now have primary evidence or explicit uncertainty. More vendor pages cannot establish small-SaaS willingness to pay, actual data approval time, deployed capacity, or current Pictify traction. The next evidence must come from customer interviews, billing/usage records, and controlled delivery tests.

## Synthesis and adversarial review

- Created canonical report-source.md and delivered strategy/evidence Markdown files in redesign-v2/plans.
- Final read-only adversarial review identified four substantive improvements, all incorporated: paid-delivery hours now displace engineering within the 60-hour weekly total; raw data has an upload-based maximum lifetime; privacy estimate depends on a 4–8-hour feasibility spike; manual cost logging starts in P0 rather than waiting for repeat-product instrumentation.
- Revised P0+P1 schedule to four to five calendar weeks during paid delivery, rather than assuming all 40 engineering hours remain available for feature work.
- Checked local-link existence and line bounds, canonical/delivered equality, prices/margin arithmetic, phase hour sums and Markdown structure. No rendered/PDF artifact is part of this Markdown deliverable; no visual/browser/product QA claimed beyond source reading and synthetic parser checks.
- Final delivered strategy: 6,596 whitespace-delimited words; evidence audit: 1,708. All checked local links resolve, referenced line numbers exist, Markdown tables have consistent columns, and canonical/delivered strategy bytes match. Codex file preview request was queued; accessible file links are the delivery mechanism. No application code or original master plan was changed.
