# Customer value campaigns: evidence and capability audit

**Access/audit date:** September 5, 2026, Asia/Kolkata. **Method:** read-only local code inspection, synthetic CSV parser checks, and primary website/documentation review through gstack browse. Three focused research lanes covered frontend, backend and competing workflows; the coordinator reconciled and spot-checked consequential claims. No production renders, customer records, inbox sends, deployments or purchases were performed.

This accompanies the [revised strategy](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/plans/customer-value-campaigns-strategy-2026-09-05.md).

## 1. What was actually inspected

| Source | Snapshot | Interpretation |
|---|---|---|
| Frontend redesign-v2 | `/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2`, HEAD `008962d`; uncommitted marketing and sender-setting edits included | Primary current product source requested by the user |
| Separate dashboard redesign | `/Users/suyashthakur/Developer/Personal/front-end-html-to-gif-dashboard-redesign`, HEAD `dc5563f` | Checked for worktree identity; not conflated with redesign-v2 |
| Backend | `/Users/suyashthakur/Developer/Personal/html-to-gif`, HEAD `ada2883`; existing thumbnail-related changes untouched | Local implementation, not proof of deployed branch or configuration |
| Integrations | Local `pictify-n8n`, `pictify-mcp`, `docs-pictify` | Useful capability/contracts; publication and live compatibility not tested |
| Original plan and prior review | Master design September 5 and first review | Hypotheses and prior gaps, not fresh market validation |
| Historical funnel | `growth-experiments/00-funnel-diagnosis.md`, pulled June 3, 2026 | 273-signup baseline is historical; current revenue/retention unverified |

Confidence labels: **implemented** means directly observed local code; **contract** means UI/API/documented expectation; **advertised** means vendor claims; **observed check** means a bounded local behavior was exercised; **unknown** requires runtime/private/customer evidence.

## 2. Frontend audit

| Capability/finding | Evidence | Meaning for the plan |
|---|---|---|
| Rich HTML variables | [VariablePropertyPanel.svelte:45](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/lib/components/editor/html/VariablePropertyPanel.svelte:45) and [handlebars-autocomplete.js:45](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/lib/utils/handlebars-autocomplete.js:45) | Editor includes arrays/objects/charts/tables and helper suggestions; server helper parity is not established by autocomplete |
| Video templates | [videoTemplates.js:5](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/api/videoTemplates.js:5) | TSX/timeline share API noun; not an automatically synchronized PNG+MP4 campaign |
| Existing metric creative | [starters.js:262](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/lib/video/starters.js:262) | Number-highlight starter is a useful base, not a complete value report |
| Workflow packs | [packs.js:19](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/lib/workflows/packs.js:19) | Existing pack registry can host a recap configuration without a new editor |
| CSV parser | [csv.js:9](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/lib/workflows/csv.js:9), [csv.js:99](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/lib/workflows/csv.js:99) | 1,000-row UI cap; no account uniqueness or strict malformed-input contract |
| Preview only first three rows | [workflow wizard:603](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/routes/dashboard/workflows/new/+page.svelte:603) | Ten representative approved examples require work; empty returned URLs also need explicit rejection |
| Single output run | [workflow wizard:833](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/routes/dashboard/workflows/new/+page.svelte:833) | One template and format; coordinated formats are additional scope |
| Resend, not render retry | [workflow.js:100](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/api/workflow.js:100) | Failed-only render retry cannot be claimed from this API |
| Individual URL handoff | [run page:443](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/routes/dashboard/workflows/[uid]/+page.svelte:443) | A reconciled manifest/ZIP is missing in this workflow |
| Hook format omission | [run page:68](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/routes/dashboard/workflows/[uid]/+page.svelte:68) | Conversion from existing run to hook does not pass outputFormat; fix before advertising it for PDF/video |
| Replay/data handling | [telemetry.js:25](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/lib/telemetry.js:25) | No explicit sensitive-campaign masking established from this config; verify project/server settings rather than claiming a leak |
| Actual homepage | [+page.svelte:1](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/src/routes/+page.svelte:1) | Uses `components/landing/*`; some modified `landingPage/*` components are legacy. Route references matter in copy fixes |

### Reproduced synthetic behavior

The existing exported `parseCsv` function was called directly with invented rows, without installing dependencies or contacting a backend:

| Input | Observed result | Required behavior |
|---|---|---|
| `customer_id,metric,metric` with `a,10,20` | First metric overwritten; resulting value `20` | Reject duplicate headers before data is lost |
| Two rows with the same customer ID | Both accepted | Reject duplicate account-period identity |
| Unclosed quote in a metric | Accepted as ordinary value | Reject malformed CSV |
| Blank versus `0` | Preserved as `""` and `"0"` | Preserve distinction through typed preflight and narrative rules |

These checks verify parser behavior only. They are not a full integration test or proof that every malformed input behaves the same way.

Uncommitted sender-settings removal coexists with workflow email options. Also, modified legacy copy advertises row re-run and ZIP while the audited workflow exposes email resend and individual URLs. Resolve product truth and active route scope; do not automatically remove the functioning backend email capability for other users.

## 3. Backend audit

| Material finding | Evidence | Consequence |
|---|---|---|
| Run items lack explicit account/revision keys | [Run.js:11](/Users/suyashthakur/Developer/Personal/html-to-gif/models/Run.js:11) | Raw data/index/one URL do not provide a reliable campaign identity contract |
| One template/output; format enum | [Run.js:69](/Users/suyashthakur/Developer/Personal/html-to-gif/models/Run.js:69) | GIF exists elsewhere but is not a current workflow-run format |
| Video cap 25 | [workflow.js:600](/Users/suyashthakur/Developer/Personal/html-to-gif/routes/workflow.js:600) | The original 250-pair rollout is not a native current run |
| Whole-run orchestration in process | [workflow.js:643](/Users/suyashthakur/Developer/Personal/html-to-gif/routes/workflow.js:643), [run-executor.js:329](/Users/suyashthakur/Developer/Personal/html-to-gif/service/run-executor.js:329) | Process termination can strand work; no pending-only restart mechanism established |
| Saves every ten items; concurrency limits | [run-executor.js:34](/Users/suyashthakur/Developer/Personal/html-to-gif/service/run-executor.js:34) | Crash reconciliation must distinguish persisted and externally completed work |
| Video queue exists, one attempt | [video-render-queue.js:28](/Users/suyashthakur/Developer/Personal/html-to-gif/service/video-render-queue.js:28) | Reuse the queue; do not incorrectly claim video is unqueued |
| Six-minute waiter; nondeterministic job creation | [video-render-queue.js:56](/Users/suyashthakur/Developer/Personal/html-to-gif/service/video-render-queue.js:56) | Late jobs can detach from run outcome; persist job/item relationship and worker completion |
| Inbound hook waits for render | [workflow.js:465](/Users/suyashthakur/Developer/Personal/html-to-gif/routes/workflow.js:465) | Synchronous result conflicts with short external webhook deadlines |
| Optional HMAC/replay in memory | [workflow.js:78](/Users/suyashthakur/Developer/Personal/html-to-gif/routes/workflow.js:78), [workflow.js:344](/Users/suyashthakur/Developer/Personal/html-to-gif/routes/workflow.js:344) | Signature replay checks are not durable business idempotency |
| First three row keys returned | [workflow.js:179](/Users/suyashthakur/Developer/Personal/html-to-gif/routes/workflow.js:179) | An account ID can disappear from projected results if placed later in the source row |
| Public caching/URL construction | [aws.js:328](/Users/suyashthakur/Developer/Personal/html-to-gif/service/aws.js:328), [aws.js:432](/Users/suyashthakur/Developer/Personal/html-to-gif/service/aws.js:432) | Public one-year cache directive is implementation evidence; actual bucket/CDN policy still unknown. Do not promise confidential delivery or revocation |
| Workflow objects not covered by ordinary media delete | [run-executor.js:133](/Users/suyashthakur/Developer/Personal/html-to-gif/service/run-executor.js:133), [media.js:11](/Users/suyashthakur/Developer/Personal/html-to-gif/routes/media.js:11) | Need owned storage keys, workflow deletion and retention across source/output paths |
| Any rendered item marks completed | [run-executor.js:369](/Users/suyashthakur/Developer/Personal/html-to-gif/service/run-executor.js:369) | Add partial/ready semantics; do not use run completed as all-account success |
| Current templates resolved during execution | [run-executor.js:311](/Users/suyashthakur/Developer/Personal/html-to-gif/service/run-executor.js:311), [video-render-worker.js:81](/Users/suyashthakur/Developer/Personal/html-to-gif/service/video-render-worker.js:81) | Snapshot approved content, especially where video rows resolve independently |
| Public sharing allows image/GIF | [SharedResult.js:21](/Users/suyashthakur/Developer/Personal/html-to-gif/models/SharedResult.js:21) | Not a native private value-report or MP4 destination |

Credit existing email implementation: [workflow-email.js:90](/Users/suyashthakur/Developer/Personal/html-to-gif/service/workflow-email.js:90) includes sender/suppression and ESP handling; [resend-webhook.js:96](/Users/suyashthakur/Developer/Personal/html-to-gif/routes/resend-webhook.js:96) handles verified delivery callbacks and deduplication; [workflow.js:857](/Users/suyashthakur/Developer/Personal/html-to-gif/routes/workflow.js:857) provides resend. These are valuable platform assets. The wedge should initially use the buyer's ESP because that avoids expanding campaign scope, not because Pictify has no email code.

No measured performance, infrastructure bill, deployment topology, Redis persistence, storage policy or production test was obtained. The plan's time/cost targets must remain proposed gates.

## 4. Claim-to-source ledger

Publication/update dates are only included when visible. All sources accessed September 5, 2026. Product pages establish advertised scope; case studies establish attributed reports, not independent causal findings.

| Source / publisher | Date | Supported claim | Limits / access |
|---|---|---|---|
| [Digital CS / Matik](https://www.matik.io/solutions-team/digital-cs) | Undated | Recurring/bulk/triggered content and automated delivery for scaled CS | Primary product page; directly spot-checked. Pricing not verified |
| [Okta case / Matik, Stacy Wu](https://www.matik.io/blog/how-matik-helped-okta-turn-digital-cs-from-a-segment-into-a-customer-success-strategy) | June 15, 2026 | Monthly value snapshots, Digital Success owner, forwardable PDFs | Enterprise context; discount disclosed; engaged customers' renewal association is not causal |
| [Modern Health case / Matik, Bex Sekar](https://www.matik.io/blog/how-modern-health-streamlined-showcasing-roi-to-enterprise-smb-accounts) | November 15, 2023 | CS Ops champion, recurring SMB program, reported 150h/month saved | Rich healthcare reporting/decks; not a matching Pictify ICP or transferable economics |
| [Customer Success AI / ChurnZero](https://churnzero.com/features/customer-success-ai/) | Undated | Existing CS platform offers summaries, narratives and value-related features | Vendor scope reviewed in delegated lane; no hands-on quality test or dollar price |
| [Customer Success / Qwilr](https://qwilr.com/role/customer-success/) | Undated | CRM-personalized check-ins/QBRs and rich-media documents | Does not establish bulk custom-video rendering |
| [Pricing / Qwilr](https://qwilr.com/pricing/) | Undated | Starter $35 annual-billed or $49 monthly; API usage fees | Coordinator spot-checked USD display. Growth/Scale have different inclusions; not managed campaign prices |
| [Recap guide / Placid](https://placid.app/blog/year-in-review-campaigns) | Undated | Direct recap/media automation alternative | Retrieved in the initial review of this same plan |
| [Pricing / Placid](https://placid.app/pricing) | Undated | $19/$39/$89/$249 monthly list; image/video/PDF generation | Rendering subscription, not a complete campaign service |
| [Pricing / Creatomate](https://creatomate.com/pricing) | Undated | $45/$109/$274 annual-billed monthly list and output retention | Generated outputs hosted up to 30 days; vendor recommends copying to own storage |
| [Wrapped guide / Customer.io, Molly Murphy](https://customer.io/learn/personalization/create-spotify-wrapped-campaign) | Publication date not verified | Gorgias annual ARR claim and Grain weekly roundup example | Gorgias campaign identified as 2022; no independent attribution check |
| [Year-in-review examples / Userlist, Ryan Robinson](https://userlist.com/blog/year-in-review-email-examples/) | June 28, 2024; updated June 11, 2025 | Mix of personalized summaries and generic newsletters | Collection is not a count of paid demand for account-value media |
| [Objects / Customer.io docs](https://docs.customer.io/messaging/objects-data/objects/start/) | Updated September 1, 2026 | Non-person objects, account relationships and personalization | Relationship modeling/plan access still must be checked for a buyer's workspace |
| [Webhook actions / Customer.io docs](https://docs.customer.io/messaging/send/workflows/webhooks/action/) | Updated September 1, 2026 | 16-second deadline, retries, idempotency header, signature and response attributes | Must design asynchronous ready-event flow; no integration was executed |
| [Reporting webhooks / Customer.io docs](https://docs.customer.io/integrations/data-out/connections/webhooks/) | Updated September 1, 2026 | Delivery IDs and machine/prefetched/proxied event fields | Metrics are not causal retention evidence |
| [Images in email / Customer.io, Alexandra Hubley](https://customer.io/learn/message-composing/images-in-email) | Publication date not verified | Text/CTA fallback, image-blocking and testing guidance | Use for general design requirements, not universal email-client compatibility assertions |
| [Cuvama scope](https://www.cuvama.com/) and [pricing](https://www.cuvama.com/pricing/) | Undated live pages | Adjacent value modeling involves approved calculations, methodology and services | Primarily sales/value-engineering buyer; excluded from recap price justification |
| [Staircase AI / Gainsight](https://www.gainsight.com/staircase-ai/) | Undated | Adjacent customer intelligence and existing-system integration | Not treated as a directly verified recap engine; Success Snapshots docs returned 403 |

## 5. Uncertainty and research stopping rule

Google and DuckDuckGo searches were blocked by CAPTCHA; a Bing search returned irrelevant results. Research continued through primary vendor pages and their internal links. This limits broad independent discovery; it does not justify asserting an absent market. Matik pricing and Gainsight snapshot documentation were not accessible. No review counts, market-size estimates or search volumes were used to establish demand.

Consequential claims now have primary support or explicit limitations. More vendor pages cannot settle small-company budget ownership, willingness to pay, current Pictify traction, deployed performance or actual data-review time. Those are the next experiment's inputs. The recommendation remains conditional on them.
