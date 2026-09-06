# V-3 — rehearsal report

Task V-3 of `plans/handoff-campaigns-r1-2026-09-05.md`: *"QA-22/23/25 rehearsal:
250 synthetic accounts, injected worker interruption, reconciled ZIP, two-account
preview in a real sending tool."*

Run 2026-09-06 against real S3 (`htgf`), real Chromium and a real standalone
Mongo. Harness: `scripts/campaign-rehearsal.js` in the backend worktree
(`--count N`, `--keep`). Everything scoped to the synthetic team `V3TESTTEAM`,
so every object key was `campaigns/V3TESTTEAM/…` and shared a prefix with
nobody; the rehearsal purged itself through the product's own purge path.

All figures are invented. The rows are awkward on purpose — a long non-Latin
name, a 64-character French one, a seven-digit figure, a customer with no prior
period — because a rehearsal on tidy data proves nothing.

## QA-25 — the 250-account run

**20 minutes end to end. Every check green.**

| | |
|---|---|
| Rendered | 250 / 250, 0 failed, terminal state `ready` |
| Throughput | **3.8 s/account** |
| Interruption recovery | **5 of 5** items abandoned under a dead lease recovered to `ready` |
| Output | 250 summaries + 250 text equivalents over **250 distinct accounts** |
| Metering | 250 outcomes, **250 consumed, 0 left reserved** |
| Size | 8.2 MiB of summaries, mean 34 KiB |
| Manifest | accounts match rendered accounts exactly |
| Purge | `purged`; second sweep of the prefix clean; 0 item rows left |

The interruption is the part the design exists for. Step 3 claims five items and
walks away without completing, failing or releasing them — which is what a killed
worker looks like from the database's side: rows marked `processing`, holding a
lease nobody will heartbeat again. Their leases are then backdated past expiry.
All five were re-claimed, rendered once, and metered once. No duplicate artifact
per account, and no double charge.

That exercises QA-10 (crash at each stage), QA-11 (stale lease, late completion),
QA-12 (partial state) and QA-19 (atomic reservation, one financial outcome per
artifact) at the pilot's own cap.

## QA-25 — the reconciled ZIP

Measured on a 60-account run, after the export fix below.

| | |
|---|---|
| Archive | 2.0 MiB, 3.7 s |
| RSS | 138.5 MiB before → 145.8 MiB peak, **growth 7.2 MiB** |
| Contents | archive ≈ summed artifacts (stored, not deflated) + text + manifests |

The growth is consistent with streaming rather than buffering. **Stated
precisely: one data point cannot prove growth is independent of archive size.**
A 250-account ZIP would settle it; if the build buffered, growth there would be
at least the 8.2 MiB of summaries rather than staying near 7.

## QA-23 — the external-tool rehearsal

Split. The half that can be automated is done and passes; the half that is the
point of the test is with the user.

Done: two synthetic profiles in a Customer.io workspace (Track API, US region),
differing in every visible field including the script their name is written in,
so a join failure would be unmissable. The email was then rendered locally with
each profile's real attributes and screenshotted, images on and off.

- Both joins correct — the card shown is that account's card, and the `alt`
  names the same company and the same figures as the picture.
- Every Liquid tag resolved; none left unsubstituted.
- Images off: company, both figures, the estimate disclosure and the CTA all
  readable. The CTA is a text link, not an image button — the thing that goes
  invisible when a client blocks images.
- Non-Latin names survive the whole path: attribute → Liquid → `alt` → PNG.

Left with the user: four UI steps in `plans/campaigns-v3-qa23/`. Screenshots of
the two previews, images on and off, close QA-23.

The Track key was verified to be Track-scoped — the App API rejects it (401), so
it can create people and cannot send email.

## QA-22

Covered by V-2 (`plans/campaigns-v2-report.md`): keyboard, focus ring, 200% zoom
on D06/D07, 1440×900, and mobile at 390. The reduced-motion pass is by
inspection, not emulation — `Emulation.setEmulatedMedia` is not on gstack
browse's CDP allowlist. One manual check with the OS setting on still owed.

## Defects

Five found by running this, four fixed.

1. **Campaign artifacts are publicly readable.** `media.pictify.io/campaigns/…`
   and the S3 URL both return 200 with no credentials. Deployment configuration,
   not R1 code — `putArtifact` sets no ACL and `CAMPAIGN_ARTIFACT_BUCKET` is
   unset, so campaign output lands in the public media bucket. Bounded: the
   bucket is not listable (403), keys carry a 128-bit slug, and `artifactUrl()`
   has no callers. **Not fixed — production infrastructure was read-only for
   this session.** Full detail and the fix in
   `plans/campaigns-v3-qa23/README.md`.

2. **The export verified 250 artifacts one at a time** — 236 s, ~0.9 s each,
   inside an HTTP request at both call sites. Batched 16 at a time in `26fc2d9`,
   with eight tests. Measured after: **70 ms/account**, a 13.5× improvement
   normalised per account. A 250-account export goes from ~4 minutes to ~17 s.

3. **browserpool crashed the process on exit** (`91429be`). The losing timer of a
   `Promise.race` was never cancelled; it fired after `cleanup()` nulled the pool
   and threw inside a timer, which is an uncaught exception. Every render run
   that then shut down cleanly hit this.

4. **Metering silently did not move the allowance counter** without a prior
   reservation — outcome rows written, `charged: true`, counter unmoved. The
   production route reserves first so the live path is correct; the harness now
   does too, and the ledger balanced exactly at 250. Worth a guard rail: the
   conditional update matching nothing is indistinguishable from success.

5. Two smaller ones from V-2, listed there.

## What the numbers mean for the pilot

**3.8 s/account is now measured, not estimated.** 250 accounts is a 16-minute
run, which is fine and comfortably inside the retention and approval flow.

The spec's **"under 1,000 accounts" tier is about an hour of continuous
rendering on one worker.** That tier needs either concurrency in the dispatcher
or a franker expectation set with the buyer. Better decided before it is sold
than after a buyer watches a progress bar for an hour.
