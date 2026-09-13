# Pictify: customer value campaigns

**Research and execution plan · September 5, 2026**  
**Audience:** founder, product/design, and engineering  
**Status:** recommended direction for a bounded paid validation; market demand is not yet validated  
**Product baseline:** `worktree-redesign-v2`, HEAD `008962d`, including current uncommitted changes; local backend HEAD `ada2883`, including its working state. Neither proves production deployment.  
**Capacity:** 40 engineering hours/week confirmed by the founder; 20 GTM hours/week carried forward from the original plan. Estimates below reserve engineering contingency and do not assume AI removes integration or QA work.

This is the next version of the [original wedge plan](/Users/suyashthakur/.gstack/projects/front-end-html-to-gif/suyashthakur-master-design-20260905-014627.md). It incorporates the actual redesign and backend rather than treating frontend API declarations as working production capabilities. The original file is preserved. Detailed evidence and implementation citations are in the companion [evidence and capability audit](/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2/plans/customer-value-campaigns-evidence-2026-09-05.md).

## 1. The decision

Pursue **repeatable customer value campaigns for B2B SaaS teams that already have usable account metrics and an existing delivery channel**. The first job is a monthly account-value update for a scaled customer program. A quarterly or renewal campaign is eligible when it has an actual upcoming send date; annual Wrapped campaigns are a separate seasonal cohort.

The initial deliverable is an approved value summary, rendered as an email-ready card or one-page PDF, plus a reliable account-to-output manifest and a tested handoff into the buyer's messaging workflow. Personalized video is an optional paid extension after its technical gate. The buyer keeps responsibility for audience selection, recipients, consent, sending, and metric definitions.

**Buyer-facing promise:** “Turn your approved customer metrics into a branded value update, ready for your next campaign.”

**Paid-launch promise, after readiness verification:** “One approved template, ten reviewed customer examples, and a reconciled campaign for up to 250 accounts, ready to send from your existing tool.”

The commercial hypothesis is that buyers will pay to remove recurring production, approval, and QA work. The technical opportunity is to add a small campaign layer to the existing rendering platform. Neither is a defensible moat yet.

### What changes from the original

| Original assumption | Revised decision |
|---|---|
| Customer/Lifecycle Marketing is the mandatory buyer | Start with the owner of a scaled customer-value program; test Digital CS/CS Ops and Lifecycle separately |
| “ROI recap” for every campaign | “Value update”; reserve ROI language for buyer-approved calculations |
| Static card versus video pair is the central experiment | First prove a recurring job; allow PNG or PDF according to recipient use, then test paid video |
| Category is relatively open | Matik already covers this job; the opening must be smaller scope and lower implementation burden |
| Two deposits unlock productization | Build essential correctness/privacy now; expand only from paid delivery and repeated bottlenecks |
| 45-day repeat for all buyers | Repeat on the agreed monthly, rolling, quarterly, or annual cadence |
| Renderer cost determines 70% margin | Include founder delivery labor; separate setup margin from repeat margin |
| One universal MP4 gate | Format-specific gates; retain the real 25-video-row limit until tested changes justify more |

## 2. What the research establishes—and does not

### Recurring customer-value communication is a real job

Matik's June 15, 2026 Okta case describes monthly value snapshots sent to roughly half its customers, including customers without a CSM. This is substantially stronger support for recurrence than a year-end email gallery. It also supports PDF-forwardable summaries and a Digital Success owner. However, Okta is not proof of demand in a small SaaS company. The story discloses a customer discount for participation, and its association between engagement and renewal is not a controlled causal result. [Matik / Okta case](https://www.matik.io/blog/how-matik-helped-okta-turn-digital-cs-from-a-segment-into-a-customer-success-strategy)

A separate Modern Health case names a Client Success Operations Manager as champion and describes throughout-year goal updates for SMB accounts. It reports 150 hours saved per month and 195 presentations generated per month. Those figures concern a much richer reporting workflow, including data integrations, not a one-page recap. Do not transfer that ROI to Pictify. [Matik / Modern Health, November 15, 2023](https://www.matik.io/blog/how-modern-health-streamlined-showcasing-roi-to-enterprise-smb-accounts)

### Annual examples are supporting evidence, not the recurring business case

Customer.io describes Gorgias' 2022 annual recap and claims over $20,000 ARR; it separately cites Grain's weekly usage roundup. These validate campaign practices, not Pictify demand or incremental video value. [Customer.io recap guide](https://customer.io/learn/personalization/create-spotify-wrapped-campaign)

Userlist's updated collection mixes individualized examples such as Buffer, Toggl Track, and Loom with generic company/product newsletters. Therefore, “20+” or “119” examples cannot be treated as that many instances of personalized account-value media. [Userlist examples, updated June 11, 2025](https://userlist.com/blog/year-in-review-email-examples/)

### There is direct competition

| Alternative | Verified overlap | How to qualify a possible Pictify opportunity |
|---|---|---|
| Matik | Scheduled, triggered, bulk customer content; conditional narratives; documents, presentations and email | Buyer only needs one compact campaign and can supply approved data; ask why Matik is not already sufficient. No verified price advantage claim |
| ChurnZero | Dynamic Slide narratives, summary emails and measurable-impact features inside a CS platform | Existing users should first explain the gap in what they already pay for |
| Qwilr | CRM-personalized check-ins/QBRs with rich media; interactive documents | Pictify would need to win bulk asset production and the ESP handoff, not “supports video” |
| Placid / Creatomate | Template-driven image/video generation, automation and batch workflows | Pictify must save setup/QA effort beyond raw rendering |
| Existing ESP + Liquid/HTML | Personalized messages from account/event data | If native text and simple HTML already solve the job cheaply, do not manufacture a need for media |
| Agency / internal team | Creative concept, data preparation, review and execution | Win a narrowly repeatable workflow rather than becoming an unlimited creative agency |

Sources: [Matik Digital CS](https://www.matik.io/solutions-team/digital-cs), [ChurnZero AI](https://churnzero.com/features/customer-success-ai/), [Qwilr Customer Success](https://qwilr.com/role/customer-success/), [Placid recap workflow](https://placid.app/blog/year-in-review-campaigns), [Creatomate](https://creatomate.com/pricing), [Customer.io objects](https://docs.customer.io/messaging/objects-data/objects/start/).

Public price anchors are contextual: Placid lists $19/$39/$89/$249 monthly plans; Creatomate displays $45/$109/$274 per month billed annually; Qwilr Starter is $35/user/month annually or $49 monthly, with API usage fees. These are software prices, not managed-campaign equivalents. Matik pricing was not verified. [Placid pricing](https://placid.app/pricing), [Creatomate pricing](https://creatomate.com/pricing), [Qwilr pricing](https://qwilr.com/pricing/)

**Evidence limit:** no new buyer interviews, customer datasets, payment records, or current retention cohorts were obtained in this research. The old 273-signup funnel was pulled June 3. Current paid and repeat Pictify usage remains unknown; refresh it before any broad homepage or business pivot. A frontend repository cannot establish that nobody pays.

## 3. Why this wedge, rather than adjacent opportunities

| Candidate | What favors it | Main unresolved obstacle | Decision |
|---|---|---|---|
| Monthly account-value updates | Direct recurring examples; matches templates, variables, batches; operational benefit measurable | Strong incumbent overlap; small-team willingness to pay unknown | Primary bounded experiment |
| Annual Wrapped | Recognizable campaign and near-term September-to-December planning window | Seasonal purchasing and bespoke creative expectations | Separate cohort; useful revenue/learning, not recurring validation |
| Renewal/QBR decks | Strong CS budget signal | Data modeling, multiple stakeholder goals, editable decks and broader reporting requirements | One-page summary only; route full-deck buyers elsewhere |
| Certificates/badges/tickets | Existing workflow packs fit well | This research does not establish their relative demand or revenue | Preserve; interview active users if telemetry shows stronger traction |
| Personalized sales video | Established adjacent spend | Different buyer and expected recording/avatar/CRM capabilities | Do not enter from this wedge |
| Horizontal media API / agent tooling | Existing product, n8n node and MCP investment | Buyers must define the use case themselves | Retain as platform and alternative purchase path |

This is a distribution and workflow experiment on top of Pictify, not permission to remove working use cases. Current customer revenue, if present, can override this priority. Do not use subjective 78/100 scores as evidence.

## 4. The first customer and the exact job

**Job:** “Each month, show our customer accounts the value they received and one useful next action, without assembling and checking every summary by hand.”

### Hard qualification

1. A named person owns a recurring customer-value/adoption program and can authorize a paid pilot or introduce the budget owner.
2. An actual send is due within 45 days; there is a recipient audience and distribution channel already in use.
3. The team can produce a flat, account-level export with a stable account ID and one to three approved metrics within five business days.
4. The prior workflow has documented production/QA cost, or an approved campaign is blocked specifically on production. Raw data availability alone does not qualify the account.
5. The buyer accepts a static summary and an existing delivery tool; they do not require a new portal, ROI model, data warehouse project or editable 50-slide deck.
6. Data and output access requirements fit the verified pilot implementation.

Company size is a search aid, not a hard gate. Begin with roughly 30–300 employee workflow/productivity SaaS companies and programs covering hundreds of customer accounts. Favor products with naturally measurable outputs—workflows completed, tasks automated, projects shipped, tickets resolved—without asserting those activities are financial ROI. Do not target sensitive health, employee performance or financial account information in the first cohort.

### Buyer discovery: two role cohorts, one job

- **Cohort A:** Digital CS, Scaled CS, CS Operations or a Head of CS personally running a scaled program.
- **Cohort B:** Lifecycle/Customer Marketing or Marketing Operations owning that same account-level program.

Begin with six substantive interviews per cohort. Separate results; do not pool advocacy-only marketers with renewal-report owners. After the first ten to twelve interviews, prioritize the role with actual scheduled campaigns, accessible data and deposits. Require budget confirmation, not a title-based assumption. The first technical approver is usually the person authorizing the export and recipient join; identify them on the first call.

**Recipient:** initially one buyer-selected account administrator or champion; multiple recipients per account are handled by the buyer's delivery system. One person may belong to several accounts, so never assume account ID equals person ID. Customer.io explicitly models objects and relationships for this distinction. [Customer.io objects and relationships](https://docs.customer.io/messaging/objects-data/objects/start/)

### Learn from examples without calling them qualified prospects

Okta and Modern Health establish the recurring job and CS ownership; they are not the initial target accounts. Gorgias, Buffer, Toggl Track and Loom provide campaign patterns, not evidence that their teams currently need Pictify. Use these as interview analogues. Every outreach account still needs a verified trigger, a named role and current qualification.

## 5. The smallest coherent product

Keep the existing editors and renderers. Add a **saved campaign configuration** around the existing run workflow:

1. Choose “Customer value update.” Select email card or one-page PDF according to the recipient's need.
2. Set campaign-level brand, reporting period, approved metric definitions, fallback policy and CTA.
3. Upload only the required customer rows; map fields and validate the entire dataset.
4. Review ten representative outputs, including adverse and extreme cases, and approve a frozen version.
5. Generate assets with durable per-account status and safe retries.
6. Reconcile every eligible account to an output; download files and a manifest or copy into the buyer's chosen storage.
7. Test the actual email/PDF/optional video recipient path in the buyer's tool; buyer authorizes and sends.
8. Next period: reuse the configuration, provide fresh values, review changes, and run again.

**First value moment:** the buyer approves representative customer outputs and successfully previews the correct asset for a test recipient. **Commercial completion:** the paid audience has a reconciled deliverable and the buyer confirms launch. A `completed` render counter alone is neither.

### Formats and narrative

- **Email card:** a concise PNG displayed around 600 CSS pixels wide; produce higher-resolution source as needed and keep file size within an explicitly tested budget. Repeat essential values and the CTA in real email text.
- **One-page PDF:** useful for forwarding to a budget owner. Use existing HTML/PDF rendering, not a new presentation engine. Do not claim a tagged/accessible PDF until verified; provide a text equivalent.
- **Video:** optional 8–15-second treatment after a paid request and readiness tests. Static fallback, an explicit playback destination and captions/understandable muted content are mandatory. A timeline/TSX video is a separate output definition; “one HTML template renders all formats” is not a truthful implementation promise.

One narrative template: reporting period → one to three approved outcomes → relevant comparison if valid → one next action. Include a neutral/low-usage variant. No automatic “great quarter” language when data shows decline. No inferred savings, rankings, benchmarks or generated customer claims without an approved method.

Customer.io advises keeping important content and CTAs readable without images and testing with imagery disabled. Treat the media as a useful component, not an image-only email. [Customer.io image guidance](https://customer.io/learn/message-composing/images-in-email)

## 6. Data, identity and approval contract

Keep the first CSV simple by moving shared definitions into campaign settings. “Five fields” should mean a small customer payload, not an omission of operational metadata.

| Location | Required fields | Notes |
|---|---|---|
| Campaign settings | `campaign_id`, schema version, period start/end, timezone, locale, brand, metric definitions, approved CTA, eligibility/fallback rules, output types | Created once; period dates must be unambiguous |
| Each CSV row | `external_account_id`, `account_name`, primary metric value | Optional second/third values and comparison inputs only when the campaign uses them |
| Metric definition | Label, unit, observed versus estimated, source owner, calculation/assumptions if derived, desired direction | Lower support time may be good; a falling metric is not automatically bad |
| Internal approval | Dataset revision, template snapshot/version, brand/font versions, approver, time, approved sample IDs | Changes after approval create a new revision |
| Export manifest | Campaign/period/revision, account ID, output role/format, status, URL or filename, error code, expiry if applicable | IDs survive API projection and column reorder |
| Buyer-only recipient map | Account ID → eligible person IDs/addresses/roles | Do not ingest email addresses unless a purchased integration genuinely needs them |

Preflight rejects duplicate headers, duplicate account IDs within a campaign period, malformed CSV, invalid dates/types and missing required data. It preserves IDs with leading zeroes, distinguishes zero from missing, and handles Unicode, long names and decimal formatting. Comparison requires compatible periods and a nonzero denominator; otherwise suppress it or show an approved alternative. Customer-level financial/time claims need methodology displayed or linked appropriately.

The existing parser was exercised with synthetic data: duplicate headers silently overwrite earlier values, repeated IDs pass, and unclosed quotes are accepted. These are reproducible preflight gaps, not hypothetical future requirements.

Proposed identity semantics:

- Unique account-period item: tenant + campaign + period + external account ID.
- Unique artifact: account-period item + approved revision + output role.
- Retried submission with the same idempotency key and identical body returns the existing result; changed body under that key is rejected and must use a new revision/request.
- Transient worker retries do not duplicate charges or sends. Rendering and sending are separate actions.
- Do not join outputs by row position, filename or display name.

Freeze data and templates before rendering. An approved campaign must not pick up a template edit made halfway through a batch. After raw-data retention ends, historical metadata does not imply the old campaign can be rerendered; the buyer must provide the approved inputs again.

## 7. Actual product readiness

| Capability | What is present locally | Required work for this offer |
|---|---|---|
| Authoring | HTML variables/helpers; video timeline and TSX; metric starter | One value-update pack and metric/fallback settings, not a new editor |
| Bulk input | CSV upload/paste/mapping and previews | Full validation, representative ten-row sample, persisted approval |
| Formats | Workflow PNG/JPG/PDF/MP4 paths | Native workflow is one template and format; paired campaign orchestration is new |
| Capacity | Workflow 1,000-row cap; video workflow hard cap **25** | UI must reflect limits; benchmark before increasing them |
| Execution | Run record plus in-process orchestration; BullMQ video jobs | Durable orchestration, persisted job/result links, restart reconciliation, failed-only retry |
| Identity | Row index, raw data and URL | Explicit account IDs, revisions, idempotency and manifest |
| Output access | Ordinary CDN/S3 URLs and public one-year cache headers in upload path | Campaign-specific private storage/access, retention and purge before confidential data |
| Automation | Inbound hooks, optional Pictify HMAC and existing outbound APIs | Asynchronous campaign acceptance, provider-compatible verification, ready/failure notification |
| Email | Backend sender/suppression/credit/delivery-callback/resend code exists | Keep buyer's ESP for this wedge; reconcile ongoing frontend sender-configuration removal |
| Sharing | Existing public image/GIF share model | Not an approved private report or MP4 destination |
| Integrations | Existing n8n image/GIF/PDF node and MCP tools | Reuse, verify actual operations; MP4 is not a current n8n-node operation |

Critical source distinctions: video is already queued, but whole-run orchestration is not durable; email resend exists, but failed-render retry is not the same operation; a settings/library delete is not verified asset/source purge. The backend marks a run completed if any row rendered, so campaign readiness must use full reconciliation instead.

## 8. Delivery architecture and one initial integration

### First campaign: export before automation

Use a reviewed CSV, generate outputs ahead of the send, and export a deterministic manifest. The buyer joins account IDs to recipients and tests the campaign in its existing tool. Customer-controlled final hosting or download/attachment is preferable when required; the current storage-connector UI does not prove workflow output routing is implemented.

The pilot includes one documented handoff and one test recipient, not a custom connector to every ESP. Customer.io is the first reference recipe because its account relationships and webhook contracts were verified; the first paying buyer can justify substituting another platform. Do not build three integrations before that choice.

### Repeated campaigns: asynchronous completion

Proposed flow: buyer's scheduled export/event → authenticated campaign request → durable acceptance with run ID → worker execution → `campaign.ready` or actionable failure → buyer-side account/recipient join → send from the buyer's tool.

Customer.io webhook actions have a **16-second timeout**, retry some failures up to 11 times over roughly an hour, and provide `X-CIO-Idempotency-Key`. They can read response values into journey attributes. Pictify's current inbound hook waits for rendering; a queued video does not make that request asynchronous. Therefore, do not build a recipe that expects an MP4 URL synchronously. [Customer.io webhook actions](https://docs.customer.io/messaging/send/workflows/webhooks/action/)

Engineering contract:

- Proposed new campaign endpoint acknowledges durable acceptance quickly, with a target under two seconds in controlled tests; this is a target, not a current SLA.
- Store the provider event/idempotency ID. Verify the provider's signature or an appropriate authenticated API credential; Customer.io's signature format is not Pictify's optional HMAC format.
- Return a run ID/status endpoint. Completion updates persist in the worker, not only in an HTTP waiter.
- n8n or the buyer's backend polls with backoff or receives a verified completion callback. It then updates the delivery data or emits an explicit ready event.
- A `202 Accepted` must not advance straight to an email with a missing asset. Check campaign, period, revision, eligible account and all required output roles before sending.
- Callbacks are retryable and deduplicated. Do not call acceptance, generation, sending, delivery and engagement the same metric.

## 9. Data handling that fits the actual campaign

These are product requirements, not a claim of legal certification.

**Private is the default for account-value campaigns.** Public sharing is a separate buyer-approved output. Stable account IDs can still be sensitive; “anonymized” is not a blanket exemption. Do not put source values or signed output URLs into analytics, session replays, prompts or error messages. Use synthetic data in AI-assisted template authoring.

Before accepting real rows, document storage regions, subprocessors actually involved in this workflow, access roles, backups/queues/logs, source lifetime, artifact lifetime and deletion mechanics. Choose a campaign storage path with private access and appropriate cache policy; do not rely on an unguessable URL or assume origin deletion invalidates a cached public asset.

Proposed default lifecycle, subject to implementation verification and buyer acceptance:

- Delete raw customer input and temporary job payloads by the earlier of **30 days after upload** or **seven days after approved delivery**; scrub relevant logs and retry queues. Failed/cancelled campaigns are purged within seven days of cancellation/final failure, subject to the same 30-day ceiling. An abandoned or disputed proof does not retain data indefinitely. Any extension needs a buyer-approved expiry recorded before the deadline.
- Retain operational metadata without customer metric values for support/accounting as explicitly documented.
- Retain downloadable private outputs for 30 days from generation unless the buyer purchases/agrees another explicit period. Final campaign hosting must cover the actual viewing/forwarding horizon; the buyer's tool/storage can own it. Approval delays do not silently extend artifact retention.
- Rendered images/PDFs themselves contain customer data and must be included in deletion and access tests.
- Restore-from-backup procedures must reapply deletion records. Publish the real backup expiry; do not promise instant deletion from immutable backups.

Email images fetched without recipient authentication cannot simultaneously be treated as strongly confidential per-recipient documents. For sensitive detail, use a buyer-owned authenticated destination or appropriate attachment; use only explicitly approved content in remotely fetched cards. No promise can recall copies already downloaded by recipients.

## 10. Paid offer and economics

Replace the false precision of “70% gross margin from the first $300 proof” with explicit setup and repeat economics. The following are **test prices**, not demonstrated willingness to pay. Do not change prices mid-cohort without recording the new offer version.

| Offer | Test price | Included scope |
|---|---:|---|
| Paid proof | **$500 upfront** | Ten static account summaries, one template, one selected format (PNG or one-page PDF), up to three approved metrics, two consolidated revision rounds, sample manifest and delivery recipe |
| First campaign | **$1,500 total**, including proof credit | Approved template/setup plus up to 250 account outputs in the chosen format, one reconciled manifest, one recipient-path test; remaining $1,000 due before full generation |
| Repeat campaign | **$500 per campaign** | Same schema/template/format and up to 250 accounts; fresh period/data, QA and handoff; one consolidated correction round |
| Video add-on | Quoted separately after readiness/cost test | One short treatment and matching static fallback; record purchase separately from core campaign |

The $1,500 launch can be presented as $1,000 reusable setup plus $500 campaign execution. Do not force a monthly subscription on quarterly buyers. The proof credit is not additional revenue. PDF versus PNG is chosen by the recipient job; it is not a randomized format contest. A second layout or language is a scoped change.

**Delivery terms:** proof within five business days of accepted data and brand inputs; full static campaign within seven business days of written approval, accepted final audience, payment and verified capacity. Buyer review pauses the clock. Deliver each paid proof independently; never make one buyer wait for another deposit. No paid paired offer or volume promise before its format gate. No uncapped revisions, source-data cleanup, bespoke ROI research or new integration included. If Pictify cannot meet agreed acceptance because of its own capability, offer an explicit refund or separately accepted revised scope.

### Labor and margin model

Count template/mapping/setup, QA, revisions, support, render/queue cost, storage/egress, fees and refunds as direct delivery cost. Track sales effort separately as acquisition cost. Use $50/hour as an illustrative replacement rate and rerun at $100/hour; do not value founder time at zero.

| Illustrative scenario | Revenue | Delivery labor | Other direct costs | Contribution after delivery costs |
|---|---:|---:|---:|---:|
| Proof: 5h at $50 | $500 | $250 | $25 | $225 / 45% |
| Entire first campaign: 10h at $50, including proof | $1,500 | $500 | $75 | $925 / 61.7% |
| Repeat: 2h at $50 | $500 | $100 | $25 | $375 / 75% |
| Repeat: 2h at $100 | $500 | $200 | $25 | $275 / 55% |

These are sensitivity examples, not cost measurements. Target at least 50% contribution on initial launches and 70% on managed repeats at the selected labor rate. A proof may be a capped learning expense, logged explicitly. At $500 repeat revenue and $25 nonlabor cost, a 70% target allows $125 labor: 2.5h at $50/h or 1.25h at $100/h. If actual effort exceeds this, standardize, increase price, or stop selling that scope.

Qualify buyer economics too. Ask for the actual previous hours and internal cost; hours saved must justify the price without invented retention uplift. A once-configured native email that takes minutes to refresh may not support a $500 recurring service. In that case, offer the existing API/self-serve route or accept that this is a one-time setup business.

Do not set permanent self-serve pricing until there are at least three independent paying organizations, two paid repeats, and observed support/compute cost. A managed repeat validates a service; a buyer successfully operating the repeat with materially less founder help is separate software validation.

## 11. Engineering roadmap at 40 hours/week

Before paid delivery, use at most 32 of the 40 engineering hours for planned implementation and reserve eight for discoveries, regressions and deployment verification. Once proofs begin, reserve **up to twelve hours of that same 40-hour block for paid production/QA/support**, leaving about twenty planned implementation hours and eight contingency hours. Together with 20 GTM hours, this stays within a 60-hour week; delivery is not an unbudgeted third job. When work exceeds the reserve, reduce engineering scope or new bookings rather than silently extending the week. The ranges below are founder estimates, not delivery guarantees. Backend changes must be developed in the correct backend checkout; do not infer production readiness from local branch code.

The first **4–8 hours of the privacy allocation** are a deployment/storage spike: verify private upload and authenticated download can bypass the current public caching path, enumerate source/queue/log/backup retention, and test deletion of synthetic artifacts. Prefer private temporary generation → authenticated buyer download → buyer-owned final hosting. Only then accept the remainder of the 16–24-hour lifecycle estimate. If that route cannot meet the agreed requirements, re-estimate or narrow the offer before accepting real data; do not promise a full retention architecture within that allowance.

| Stage | Scope and budget | Acceptance / stop condition |
|---|---|---|
| P0: controlled proof readiness | **48–64h**, conditional on the privacy spike: input preflight/explicit IDs 10–14h; frozen proof configuration and representative preview 8–10h; private artifact/source lifecycle 16–24h; manifest/download and truthful limits 10–12h; synthetic QA and initial cost ledger 4h | Ten outputs mapped correctly; malformed rows rejected; data/access/purge contract verified; one static recipient path works. Pause real-data offers if privacy cannot fit the budget |
| P1: paid rollout reliability | **40–56h**: durable row processing and reconciliation 18–24h; failed-only retries/idempotent metering 8–12h; partial/cancel/export states 6–8h; restart/failure/load tests 8–12h | 250-static-account rehearsal survives process restart and retry; every eligible account resolved; no duplicate charges or accidental sends |
| P2: repeat product, gated by paid delivery | **24–40h**: saved next-period workflow, changed-data review, one verified ESP/n8n recipe and ready event, automation of the existing campaign cost ledger | A repeat uses the same configuration with lower operator time and an independently confirmed buyer launch |
| P3: paired output, gated by paid video request | **24–40h**, plus measured capacity work if necessary: shared revision, coordinated outputs, pair readiness, safe async handoff, video benchmark | One pair per approved account; no send with a missing required asset; justified volume cap and cost |

P0 and P1 total **88–120 implementation hours**. Budget approximately **four to five calendar weeks** when P0 runs at 32 planned hours/week and P1 slows to about twenty during paid delivery; more complex privacy work changes that estimate. Start a manual ledger in P0 recording labor, render attempts, compute allocation, storage/egress, fees and corrections; P2 automates it rather than creating the first cost evidence. Reassess after the first 64 hours and early interviews. If the missing work is primarily a new security architecture or a data platform, narrow the pilot or stop; do not bury that change inside an M-sized estimate.

### Concrete implementation targets

- Frontend: strengthen `src/lib/workflows/csv.js`; add a value-update pack to `packs.js`; extend the current workflow wizard/run view with ID mapping, representative samples, approval, failed-only recovery and manifest output. Preserve the redesign's existing visual system.
- Fix run-to-hook creation omitting `outputFormat`; align frontend/backend format and row caps.
- Backend: extend `models/Run.js` or add a small campaign definition plus run/item records; snapshots and stable item keys are mandatory. Reuse BullMQ rather than creating another queue stack. Persist worker completion independently of the six-minute waiter.
- Add campaign-specific private storage and explicit owned object keys. Do not globally change public OG-image behavior for unrelated users.
- Scope “buyer sends from its own tool” to the recap workflow. Reconcile sender-settings removal and remaining email UI deliberately; do not delete a working general workflow for existing users just to simplify this wedge.
- Audit active marketing surfaces and metadata for false “one template/all formats,” row-retry, ZIP, privacy, throughput or permanent-link claims. Some changed legacy components are not mounted on the redesigned homepage; inspect route usage before editing.
- Existing n8n node covers image/GIF/PDF and async image batches. A campaign recipe can use HTTP/polling first; new node operations wait for stable campaign endpoints.

## 12. Verification contract

### Proof gate: before customer data and collecting a delivery commitment

Use synthetic rows to verify identity, rendering, access and deletion. Test ten examples: normal, long account name, Unicode, zero, missing optional data, declining metric, invalid comparison, large value, decimal/localized value and an explicitly suppressed row. Keep rejected/suppressed fixtures separate from the ten accepted proof outputs. The UI should explain corrections rather than silently trimming or inventing data.

### Static rollout gate

- Test 250 accepted accounts plus separate invalid fixtures. Reordering rows/columns does not change identity joins.
- Every eligible account has exactly one correct approved artifact per required format, or an explicit unresolved failure that blocks export as launch-ready. A buyer can approve an explicit exclusion with reason; counts reconcile.
- Restart the orchestrator and worker mid-run. Replay the same request and completion callback. No lost accepted work, duplicate charges, mismatched files or implicit emails.
- Freeze the template, then edit the live template during the run. Outputs still use the approved snapshot.
- Verify owner access and denied cross-tenant access, actual URL expiry/purge behavior, and cleanup of source, rendered assets and queued payloads.
- Benchmark actual duration and all direct costs. Technical first-pass success target ≥99%; paid delivery acceptance still requires reconciliation of the remainder. A single rehearsal is a launch gate, not a statistical reliability guarantee.

### Video gate

Test representative templates at 1 and 25 accounts before expanding. Measure queue wait and render duration separately, memory, retries, orphan jobs, competing previews, cold starts, upload/egress and cost. A server process with one worker is not necessarily the entire production topology. Do not derive a volume SLA from a developer comment about render duration. Test 100/250 only after queue and orchestration changes are sound; increase the exposed cap only to the volume actually verified.

### Recipient gate

Test in the buyer's tool and audience-relevant clients: correct account/person join, mobile and desktop, images disabled, text CTA, PDF readability, optional video link/poster, approved hosting duration and no cross-account content. Buyer signs off before sending. Never run real sends as part of autonomous QA without explicit authorization.

## 13. Acquisition and interview plan

GTM starts alongside P0 using synthetic examples. Do not wait for a new onboarding funnel. Do not send outreach automatically under this research assignment.

**First six weeks, maximum 120 GTM hours:** build at most 80 researched accounts, contact at most 60 named people initially, and budget up to two relevant follow-ups each. These are work limits, not promised conversion rates. Hold back 20 additional accounts for a revised hypothesis. Track accounts and contacts separately.

Weekly GTM allocation: six hours research/targeted outreach, six interviews and follow-ups, four offer/approval coordination, two existing-user learning, two evidence review. Creative production/render QA/support uses the delivery reserve in the engineering block above; sales and approval coordination use GTM. Track them without double-counting. Cap simultaneous paid proofs at two and accept a delivery date only when the reserve can cover the scoped work. The six-week acquisition limit does not cancel paid commitments already accepted; complete them within the reserved capacity.

Discovery order:

1. Show the last real customer-value email/report and how it was assembled. Record frequency, audience, hours, cost and approval steps.
2. Identify metric ownership and recipient mapping; inspect a schema before requesting real values.
3. Ask what prevents using existing ESP templates, Matik/CS-platform capabilities, Qwilr, a renderer or the internal team.
4. Confirm the next campaign date, budget owner and purchasing/data-review process.
5. Show a reusable synthetic card and PDF; show video only as an optional treatment. Ask which deliverable fits the recipient task and why.
6. Offer the scoped paid proof. Record rejection reasons, not only compliments.
7. Before starting, record the next natural campaign date and the measurable benefit the buyer expects.

**Outreach example:** “Your team already shows customers [verified value metric/report]. We’re testing a way to turn an approved account export into branded value updates, with a checked output for each account and a handoff to your current email tool. Is the next campaign owned by your team? The paid proof is $500 for ten account summaries, credited toward a $1,500 launch.” Use no invented trigger, customer endorsement, savings claim or personalized private data.

Partner work follows direct evidence: speak with three lifecycle/CS implementation consultants about recurring production bottlenecks. They can become delivery partners after one repeated schema is proven. Do not build a community node that already exists or publish five ecosystem recipes before a buyer uses one.

## 14. Decision gates and measurement

Dates below are relative to starting the experiment, not a promise that procurement follows the schedule.

| Gate | Evidence required | Decision |
|---|---|---|
| By day 14 | 6–8 substantive buyer conversations; at least two usable schemas; at least three buyers describe the same scheduled job and a production bottleneck | Select initial owner/job. If all need data cleanup or broad QBR software, revise before more campaign-specific build |
| By day 30 | Target twelve qualified interviews and two independent paid proofs at recorded prices; P0 passes before real rows | Continue if the same job/data contract repeats. One proof is directional; zero payments after ≥12 qualified interviews triggers one explicit offer/segment revision |
| By day 45–60 | At least one full-price rollout; tested 250-static scope if sold; delivery hours and buyer launch recorded | Proves campaign value beyond buying a small design sample. No rollout means diagnose quality, approval, price or handoff |
| Six-week budget limit | Up to 120 GTM hours, 60 initial contacts, and one documented targeting/offer revision | If qualified interviews remain scarce, acquisition is unproven. Pause/replace the channel; do not call the wedge disproven or continue indefinitely |
| Repeat on actual cadence | Monthly: paid launched repeat within 45 days of launch. Quarterly: next agreed quarter +15-day grace, about 105 days. Renewal: next agreed eligible cohort. Annual: next annual cycle | Prepayment counts as commitment separately; do not label annual demand recurring-monthly validation |
| Expansion gate | ≥3 independent paying organizations, ≥2 paid repeats across ≥2 organizations, same core schema/job, repeat contribution ≥70% at chosen labor rate | Expand self-service and another integration. If founder work remains bespoke, manage it explicitly as a service |

These small samples are operational decision thresholds, not statistically conclusive market proof. Review win/loss reasons and source quality alongside counts. Discounted tests, friendly favors and unpaid proofs are tagged separately. A happy one-off campaign is a valid service result, but not evidence for a recurring software business.

### Measure two different kinds of value

**Primary initial value:** production/QA hours avoided, elapsed time from accepted data to approved outputs, buyer effort, eligible audience coverage and time to repeat. Capture the prior workflow before the pilot. A proposed target is ≥50% lower repeat production effort or an otherwise documented buyer benefit sufficient to justify the price; it is not a claim to put on the landing page yet.

**Secondary campaign effect:** one buyer-owned behavioral outcome such as target-feature adoption, a qualified response, or a renewal conversation. Choose a read date and denominator before launch. When feasible, randomize at account level with the same copy, CTA and send time, comparing the current text/HTML message with the media-enhanced message. Keep all recipients of one account in the same arm. Small campaigns may only support directional results; no invented significance or retained-revenue attribution.

Customer.io reporting events distinguish machine clicks, prefetched/proxied opens and delivery identifiers. Use these distinctions; image downloads and email opens do not prove human attention. [Customer.io reporting webhooks](https://docs.customer.io/integrations/data-out/connections/webhooks/)

Instrument distinct events: schema accepted, proof approved, payment received, run accepted, artifact generated, account pack ready, export reconciled, buyer launch confirmed, measured outcome received and next campaign paid/launched. Use pseudonymous operational IDs in analytics; never raw customer metrics. Do not build a new analytics platform before the buyer's existing reports become a blocker.

## 15. Risks, change triggers and boundaries

| Risk | Evidence to watch | Response |
|---|---|---|
| Existing tool is enough | Buyers show fast native campaigns and no production cost | Stop selling unnecessary media; preserve API route and test a different job |
| Data preparation dominates | Schemas take >5 business days or every buyer needs bespoke calculations | Narrow to already-approved exports; do not silently become ETL/ROI consulting |
| Buyer ownership fragmented | Same job requires too many functions without budget | Qualify sponsor earlier; select one role cohort |
| Confidentiality requirements exceed product | Private access/deletion or procurement cannot pass | Pause real data; scope an acceptable delivery route or disqualify |
| Paid proofs never launch | Approval, recipients, hosting or pricing blocks rollout | Fix that handoff before more templates or acquisition |
| Repeats remain bespoke | New schema/narrative and >labor budget every time | Reprice as service, constrain scope or stop recurring-software claim |
| Video creates cost without value | No paid add-on or no useful recipient behavior | Leave video optional; do not block static/PDF campaigns |
| Annual campaign dominates | Buyer only wants December and rejects a next use | Run a seasonal offer with seasonal economics; do not count it toward monthly recurrence |
| Existing users have stronger traction elsewhere | Refreshed billing/repeat usage shows another paid use case | Reallocate effort based on actual customer evidence |

Non-goals until paid evidence demands them: ROI discovery/calculators, data warehouse connectors, account health/renewal forecasting, full QBR decks, avatars/voice/recording, a new email sending platform, interactive Wrapped microsites, public social virality, more generic editor features, and multiple native ESP integrations.

## 16. Immediate next actions

1. Refresh current paying-user and repeat-render evidence; interview up to five existing repeat users before assuming a new wedge outranks them.
2. Turn P0/P1 into small implementation tickets in the frontend and backend repositories using the acceptance checks above. Preserve current worktree changes.
3. Build one reusable synthetic value-update template in PNG and PDF, with an honest text equivalent and adverse-case examples. Use measured usage, not fabricated savings.
4. Research the first twenty accounts across the two buyer-role cohorts; book interviews and test the paid offer while P0 is built.
5. After ten to twelve interviews, make a written owner/job selection. After each paid campaign, record economics and next due date.

The evidence now supports a more precise experiment: a compact account-value campaign workflow alongside the buyer's existing CS and messaging stack. It does not support “uncontested market,” guaranteed retention lift, or a full product pivot. The next major investment is justified by paid campaign launches, reliable repeat operations and lower buyer/founder effort—not by more rendering formats.
