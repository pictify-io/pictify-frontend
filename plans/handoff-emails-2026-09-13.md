# Handoff — Transactional emails v2 (design → implementation)

Date: 2026-09-13. Repo: **pictify-io/html-to-gif** (backend), worktree `.claude/worktrees/campaigns-r1`
unless the user says otherwise. One frontend touch (§3, the hosted wordmark PNG) lands on
`worktree-redesign-v2`.

## 1 · Sources of truth

- **Words:** `plans/handoff-emails-2026-09-13.md` (this file) for build rules; `plans/email-copy-2026-09-13.md`
  for every subject, preheader, heading, body, button, row and footer with `{placeholders}`. Copy is final.
- **Look:** Paper file `01KZQXXEZ2SNPWS5PN2FCF31PC`, page **06 · Email & OG**. Boards:
  Verify `BKI-0` · EM-01 Welcome `MSK-0` · EM-02 Reset `MU4-0` · EM-03 Usage 90 `MVO-0` ·
  EM-04 Invite `MX8-0` · EM-05 Webhook `MYS-0` · EM-06 Overage `N0C-0` · EM-07 MCP follow-up `N84-0` ·
  EM-00 notes `N3G-0` (variants, subjects, build rules). Use `get_jsx` / `get_computed_styles` for exact
  values; never read sizes off screenshots.
- Three body patterns only: prose + button (verify, welcome, reset, invite, MCP), ledger + button
  (webhook, overage), meter + ledger + button (usage). Nothing else per email.

## 2 · What to build

| # | Template file (backend `templates/`) | Board | Data change |
|---|---|---|---|
| 0 | `email-layout.ejs` — full rewrite (§4) | all | takes `preheader`, `footerWhy`, optional `unsubscribeUrl` |
| 1 | `user/verify-email.ejs` | BKI-0 | none |
| 2 | `user/welcome.ejs` | EM-01 | none; **send after verification** (§6) |
| 3 | `user/reset-password.ejs` | EM-02 | none |
| 4 | `user/usage-alert-90.ejs`, `usage-alert-50.ejs` | EM-03 + 50% variant in EM-00 | 50% needs `daysLeft` (days to `nextResetDate`) |
| 5 | `team/invitation.ejs` (invite + reminder via a `reminder` flag) | EM-04 | `inviterFirstName`; reminder subject/eyebrow/H1 in the copy doc |
| 6 | `user/webhook-paused.ejs` | EM-05 | `targetHost` for the subject (hostname of `targetUrl`) |
| 7 | `user/overage-invoice.ejs`, `overage-reminder-3day/6day.ejs`, `overage-service-stopped.ejs` | EM-06 + ladder in EM-00 | `total`, `planLimit`, `rate`, `dueDate` must be passed from `scripts/generate-overage-invoice.js` and `service/overage-reminder-queue.js` (they exist on the invoice model / plan); day 7 adds ledger row STATUS |
| 8 | **new** `user/mcp-follow-up.ejs` + scheduler (§7) | EM-07 | `userName` |

Subjects change too (copy doc): they are set in `models/User.js`, `models/WebhookSubscription.js`,
`routes/team-invitations.js`, `service/overage-reminder-queue.js`, `scripts/generate-overage-invoice.js`.
Drop the emoji from the usage subjects.

Not in scope: `campaign/*` drips, `trial-*`, `abuse-alert`, `dormant-user-reminder`,
`security-password-reset`, `marketing/out-of-beta`.

## 3 · The logo (non-negotiable)

Use **the bolt mark**, the same one as `src/lib/components/BrandMark.svelte` / `static/favicon.svg`
on the frontend: ink rounded tile (rx 7 on a 28 grid) with the field-yellow bolt
`M13 10V3L4 14h7v7l9-11h-7z` at `translate(5,5) scale(0.75)`, then the word **Pictify** in Bricolage
Grotesque 700, 23 px, tracking −0.02em, ink. The boards were corrected today; any two-square mark you
see anywhere is the old placeholder, do not reproduce it.

Email clients do not render inline SVG reliably (Gmail strips it, Outlook ignores it), so ship the
wordmark as a **PNG at 2×**: `static/email/wordmark-field@2x.png`, 216×56 (displayed 108×28), the
band colour `#D8F34A` baked into the background (no transparency: Outlook 2016+ and dark-mode Gmail
mishandle alpha on coloured grounds). Generate it with the browse binary from an HTML snippet that
uses the exact SVG + Bricolage from Google Fonts (same way `scripts/og-v2.py` renders cards), commit
it on `worktree-redesign-v2`, and reference it by absolute URL `https://pictify.io/email/wordmark-field@2x.png`
with `width="108" height="28" alt="Pictify"` and `style="display:block;border:0"`. Until the frontend
deploys, the dev preview may use the file path; production must use the https URL.

Keep the `media.pictify.io/e28mh-…jpeg` old-brand JPEG out of the new layout.

## 4 · Layout rules so every client renders it (email-layout.ejs)

Build like it is 2009 and it will render in 2026:

- **Tables, not divs.** Outer 100% table with `bgcolor="#E2E4DD"` (canvas), centred 600 px table
  (`width="600"` attribute *and* `style="width:600px;max-width:600px"`). Wrap the 600 px table in
  `<!--[if mso]><table width="600" …><tr><td><![endif]-->` … `<!--[if mso]></td></tr></table><![endif]-->`.
- **Inline CSS on every element** (`style=""`), plus a `<style>` block only for: web-font `@import`,
  `@media (max-width:620px)` (600 → 100% width, 36 px padding → 20 px), and Gmail/Apple dark-mode
  guards. Assume the `<style>` block may be stripped and the email must still look right.
- **Card**: the 1.5 px ink border is `border:1.5px solid #000000` on the card td (Outlook renders
  1 px; fine). The 6 px ink offset shadow is **not** `box-shadow`: nest the card table inside a
  wrapper table whose right/bottom cells are 6 px wide/tall `bgcolor="#000000"` cells, or skip the
  shadow for `mso` via conditional. `border-radius:16px` on the card; Outlook squares it, accepted.
- **Band**: 96 px tall td `bgcolor="#D8F34A"`, `border-bottom:1.5px solid #000`. Left: the wordmark
  PNG. Right: the pixel run as a **7×3 table of 24 px `<td>` cells with `bgcolor`** (colours from the
  board via `get_jsx`: blue `#0078BF`, ink `#000`, powder `#D3E7F6`, pink `#FF48B0`, sky `#A9D7F2`,
  empty = band colour). It sits flush right, top-aligned at 44 px; the −12 px bleed on the board is
  dropped (no overflow clipping in email). Each cell has `width="24" height="24"` and a
  `&nbsp;`-free `<td>` with `line-height:24px;font-size:0`.
- **Fonts**: `<link>` + `@import` for Bricolage Grotesque 700, Inter 400/500/600, JetBrains Mono 400
  from Google Fonts, and font stacks that still read when the link is ignored (Gmail):
  heading `'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif; font-weight:700`,
  body `Inter, 'Helvetica Neue', Arial, sans-serif`, mono `'JetBrains Mono', 'Courier New', Courier, monospace`.
  Sizes from the board: preheader mono 11/14 mute · eyebrow mono 11/14 0.08em (royal `#0054A6` for
  account/info, ink for money/pause) · H1 34/40 −0.02em ink · body 16/26 slate `#383A42` · mute
  13/20 `#8A8A85` · rows Inter 14/20 ink with an 8 px colour square td · footer mono 11/14 + Inter 12/18 mute.
- **Button**: bulletproof pattern. A `<td bgcolor="#000000" style="border-radius:6px">` holding an
  `<a>` with `display:inline-block;padding:15px 24px;font:600 15px/18px Inter…;color:#FFFFFF;text-decoration:none`,
  followed by the 8 px field square as an inline `<span style="display:inline-block;width:8px;height:8px;background:#D8F34A;margin-left:10px;vertical-align:middle">`
  (Outlook drops the span; the label still reads). Add the VML `<!--[if mso]><v:roundrect …>` variant
  so Outlook gets a clickable filled button. Width hugs the label with 24 px side padding
  (board: MT0-0 etc. are `fit-content`).
- **Ledger** (webhook, overage, usage): a 526 px table, one row per fact, `border-bottom:1px solid #E5E7EB`,
  label td `width="160"` mono 11 mute uppercase, value td Inter 14/20 500 ink (mono 13 for URLs and
  error strings). Overage's AMOUNT DUE row: `border-bottom:1.5px solid #000`, value Bricolage 24/28 700.
- **Meter** (usage): a 526×10 two-cell table, first cell `width` = `Math.round(pct*526)` `bgcolor="#000000"`,
  second cell `bgcolor="#E5E7EB"`. No CSS gradients, no `div` widths.
- **Code block** (welcome, MCP): a td `bgcolor="#131417"` `style="border-radius:6px;padding:16px 18px"`,
  text `#ADB9C6` mono 12/19, `white-space:pre` with explicit `<br>` per line and `&nbsp;` for leading
  indent; HTML-escape the content (`<h1>` in the curl sample must arrive as `&lt;h1&gt;`).
- **Preheader**: first thing in `<body>`: `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">{preheader}&zwnj;&nbsp;…×40</div>`.
  The visible mono preheader line above the card on the board is the same string.
- **Footer** outside the card: mono line `PICTIFY · TEMPLATED MEDIA FOR DEVELOPERS · PICTIFY.IO`, then
  the `footerWhy` sentence (always present, per email), then the `unsubscribeUrl` row only when
  passed (marketing/drip; never on these seven).
- **Dark mode**: `<meta name="color-scheme" content="light">` + `<meta name="supported-color-schemes" content="light">`;
  every coloured td carries a `bgcolor` attribute as well as CSS so Gmail's dark inversion leaves the
  band and card alone; text colours set explicitly on every text element, never inherited.
- **Images**: only the wordmark PNG (absolute https, width/height attributes, alt). Everything else
  is text and table cells. No background images.
- **Plain-text part**: `sendEmail` must pass `text` (Resend `text` field): subject-less prose of the
  same content, links in full. Generate from the template data, not by stripping HTML.
- **Width on phones**: at ≤620 px the 600 table becomes 100%, card padding 36 → 20 px, code block
  scrolls horizontally (`overflow-x:auto` is ignored by most; wrap at 320 px is acceptable for the curl).
- **Links** in rows are plain text URLs on the board; make them real `<a>` with `color:#0054A6;text-decoration:underline`.

## 5 · Rendering pipeline stays

`service/email-template.js` (template → layout) and `service/resend.js` `sendEmail({templatePath, subject, data, layoutData})`
stay. Add `layoutData.preheader` and `layoutData.footerWhy` from each sender. `config/email-preview.js`
gets sample data for all eight (add `mcp-follow-up`, `team-invitation-reminder`, `overage-day3/6/7`,
`usage-alert-50`); `/dev/email-previews` must show every one.

## 6 · Welcome after verification

`models/User.js` post-save hook calls `sendSignUpEmail()` at the same moment `routes/auth.js`
sends the verification email, so a new user gets two emails in one second and reads the wrong one
first. Move the welcome send to the verification-success handler in `routes/auth.js` (and to OAuth
signup, which arrives verified). Guard with a `welcomeSentAt` field so re-verification never resends.

## 7 · EM-07 MCP follow-up scheduler

New BullMQ delayed job (reuse the drip queue plumbing in `service/drip-queue.js` but **not** gated by
`DRIP_ENABLED`; this is transactional onboarding, one send): enqueue at signup with a 24 h delay;
on run, send only if `emailVerified` and no API request from the MCP client has been seen for this
account. Detection: `@pictify/mcp-server` sends a `User-Agent` / `X-Pictify-Source: mcp` header (check
`pictify-mcp/src` for the exact header; add one if missing and record `lastSourceMcpAt` on the token
or user when it is seen). Mark `mcpFollowupSentAt` so it never repeats. Skip if the account was
deleted or is a team invitee-only user.

## 8 · Acceptance

- `/dev/email-previews` shows all eight; each matches its board at 600 px (compare with the browse
  binary screenshot side by side) and holds together at 360 px.
- Test sends via Resend to a Gmail (web + iOS app, light and dark), Outlook.com and Outlook desktop,
  Apple Mail: band colour intact in dark mode, wordmark loads, button clickable in Outlook, no
  horizontal scroll on phones, fonts fall back cleanly when the Google link is blocked.
- Plain-text part present on every send (`resend` payload has `text`).
- New signup receives verify first; welcome arrives only after the link is used; EM-07 arrives ~24 h
  later only when no MCP request was seen; each fires once.
- Usage 50/90, invite + reminder, webhook paused, overage + day 3/6/7 all render with real data from
  their senders (run the overage reminder processor against a fixture invoice).
- `node --test` passes; add a test for `humanizeSubject`/data shaping where new fields were added.
- No `press`/`counter` copy anywhere in the seven emails (grep).

## 9 · Worktree rules

Shared worktrees, concurrent sessions: never `git stash`, never `git add -A`; stage only your own
hunks; `git status` before committing. This session has nothing uncommitted in `campaigns-r1`; on
`worktree-redesign-v2` the untracked `scripts/blog-cover.py` and the workflows-retirement edits are
not yours to stage.
