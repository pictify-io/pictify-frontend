# Transactional email copy — v2 (2026-09-13)

Source of truth for words: Paper file `01KZQXXEZ2SNPWS5PN2FCF31PC`, page **06 · Email & OG**, boards EM-01…EM-06 and the EM-00 notes card. This file mirrors the boards so the EJS rewrite can copy-paste. Placeholders in `{braces}` map to the existing template data (`userName`, `verifyLink`, `resetPasswordLink`, `currentUsage`, `monthlyLimit`, `remaining`, `nextResetDate`, `planName`, `inviterName`, `inviterEmail`, `teamName`, `inviteUrl`, `expiresAt`, `event`, `targetUrl`, `lastError`, `pausedAt`, `month`, `overageCount`, `amountFormatted`, `checkoutUrl`).

Voice rules (apply to every email): fact first; no emoji, no exclamation marks; numbers over adjectives; one verb per button; the footer line always says why the person got the email; the preheader carries the consequence or the deadline in caps mono, 80 chars max.

## EM-01 Welcome (`templates/user/welcome.ejs`, sent on signup) — v3 copy

- Subject: `Your first render is one request away`
  - alt A: `Your Pictify API key is live` (plain, safest deliverability)
  - alt B: `{userName}, HTML in, image out. Start here.` (punchier, use if opens are weak)
- Preheader: `YOUR API KEY IS LIVE. 50 FREE RENDERS A MONTH, NO CARD NEEDED.`
- Eyebrow: `WELCOME TO PICTIFY` · H1: `Hi {userName}. Your first render is one request away.`
- Body: `Pictify turns HTML into images, PDFs and GIFs, on demand or from code. Your API key is live, the first 50 renders each month are free, and every file you make is kept in your renders.`
- Button: `Open the dashboard` → `https://pictify.io/dashboard`
- Line: `From a terminal, this is the whole integration:` + code block
  ```
  curl https://api.pictify.io/image \
    -H "Authorization: Bearer $PICTIFY_KEY" \
    -d '{"html":"<h1>Hello, {userName}</h1>","width":1200}'
  ```
- Rows, label `MORE WAYS IN`: `Try it in the browser first: pictify.io/tools/html-to-image` / `Build a template once, render it with new data every time: pictify.io/dashboard/template/create` / `SDKs, examples and the full reference: docs.pictify.io/quickstart`
- Footer: `You are getting this because you created a Pictify account with this address. 50 renders a month are free, no card needed. Reply to this email and a human answers.`

Product issue to fix alongside: signup sends welcome and verify at the same moment from two places (`models/User.js` post-save hook and `routes/auth.js`); send welcome after verification.

## EM-07 MCP follow-up (NEW template `templates/user/mcp-follow-up.ejs`) — the "next mail"

Trigger: 24 h after signup, only if the address is verified and no request has arrived with the MCP user agent / `source=mcp` (the `@pictify/mcp-server` client identifies itself; check `ApiToken.lastUsedBy` or the request log). Sent once. Board: EM-07 on page 06.

- Subject: `Render from Claude without writing a line`
  - alt A: `Your AI can use Pictify now` · alt B: `{userName}, one command connects Pictify to Claude`
- Preheader: `CONNECT PICTIFY TO CLAUDE, CURSOR OR WINDSURF. ONE COMMAND, NO CODE.`
- Eyebrow: `DAY ONE · YOUR AI CAN RENDER TOO` · H1: `Ask Claude for the image.`
- Body: `Hi {userName}. Your account is live and the key already works. Connect the Pictify MCP server to the assistant you already use and say "make an OG image for the launch post". It renders through your account and hands back a URL. No code, no template first.`
- Button: `Connect Pictify to Claude` → `https://pictify.io/dashboard/api-token` (the page that shows the MCP snippet with the real key)
- Line: `Claude Code is one line. Cursor, Windsurf and Claude.ai setups are on the same dashboard page:`
- Code block (keep `<your key>` as a placeholder, never the real key in email):
  ```
  claude mcp add pictify \
    -e PICTIFY_API_KEY=<your key> \
    -- npx -y @pictify/mcp-server
  ```
- Rows, label `WHAT IT CAN DO FROM A CHAT`: `OG images, social cards and screenshots from HTML or a URL` / `PDF invoices and certificates from the templates you save` / `Up to 100 personalised images in one request, badges, passes, catalogues`
- Footer: `You are getting this because you created a Pictify account yesterday and have not connected an AI client yet. This is the only follow-up.`

## Verify email (`templates/user/verify-email.ejs`) — approved board BKI-0, copy unchanged

- Subject: `Verify your email to start rendering`
- Preheader: `ONE CLICK AND YOUR 50 FREE RENDERS A MONTH ARE LIVE.`
- Eyebrow: `VERIFY YOUR EMAIL` · H1: `One click and your account is live.`
- Body: `Confirm this address and you are in: 50 free renders a month, an API key that already works, and every file you render kept in your renders.`
- Button: `Verify email` → `{verifyLink}`
- Line: `The link works for 24 hours. If the button does nothing, paste this into your browser:` + link
- Rows, label `WHILE YOU WAIT`: `Make your first image in the browser, no code: pictify.io/tools/html-to-image` / `One curl and you are rendering from code: docs.pictify.io/quickstart`
- Footer: `You are getting this because someone signed up with this address. If it wasn't you, ignore it and nothing happens.`

## EM-02 Reset password (`templates/user/reset-password.ejs`)

- Subject: `Reset your Pictify password`
- Preheader: `THIS LINK WORKS FOR 30 MINUTES. NOTHING CHANGES UNTIL YOU USE IT.`
- Eyebrow: `RESET YOUR PASSWORD` · H1: `Pick a new password.`
- Body: `Hi {userName}. You asked to reset the password for this Pictify account. The button opens a page where you set a new one. The link works for 30 minutes and only once.`
- Button: `Choose a new password` → `{resetPasswordLink}`
- Line: `The link works for 30 minutes. If the button does nothing, paste this into your browser:` + link
- Rows, label `DIDN'T ASK FOR THIS?`: `Ignore this email. Your current password keeps working and nothing changes.` / `Think someone else has your login? Reply to this email and we lock the account with you.`
- Footer: `You are getting this because a password reset was requested for this address. Pictify will never ask you for a password or for this link.`

## EM-03 Usage 90% (`templates/user/usage-alert-90.ejs`)

- Subject: `{remaining} renders left until {nextResetDate}`  (example: `50 renders left until 1 October`)
- Preheader: `{currentUsage} OF {monthlyLimit} RENDERS USED. AT {monthlyLimit}, NEW RENDERS PAUSE UNTIL {nextResetDate}.`
- Eyebrow: `USAGE · 90% OF {planName}` · H1: `{remaining} renders left this month.`
- Body: `Hi {userName}. {planName} includes {monthlyLimit} renders a month and you have used {currentUsage}. At {monthlyLimit} we pause new renders until the meter resets on {nextResetDate}. Everything already rendered stays exactly where it is.`
- Meter 90% + ledger: USED `{currentUsage} of {monthlyLimit} renders` · LEFT `{remaining}` · RESETS `{nextResetDate}` · PLAN `{planName} · {monthlyLimit} renders a month`
- Button: `Upgrade before the cap` → `https://pictify.io/dashboard/billing`
- Line: `Expecting a spike rather than a new normal? Reply with the number you need and we raise the limit for this month, no upgrade required.`
- Rows, label `WHAT HAPPENS AT {monthlyLimit}`: `API calls return 429 quota_exceeded with a link to plans. Nothing is billed.` / `Dashboard renders pause too. Templates, keys and past renders stay untouched.`
- Footer: `You are getting this because your Pictify account crossed 90% of its monthly plan. We send this once a month, at 50% and at 90%.`

### Usage 50% variant (`usage-alert-50.ejs`)
- Subject: `{currentUsage} of {monthlyLimit} renders used, {daysLeft} days to go`
- Preheader: `{currentUsage} OF {monthlyLimit} RENDERS USED. {daysLeft} DAYS UNTIL THE METER RESETS.`
- Eyebrow: `USAGE · 50% OF {planName}` · H1: `{currentUsage} of {monthlyLimit} renders used, {daysLeft} days to go.`
- Body: `Hi {userName}. Right on pace. If a launch is coming this month, this is the cheap moment to move up a tier: the new limit applies today.`
- Meter 50%, same ledger. Button: `See plans`. Line: `No launch coming? Nothing to do. You will hear from us again only at 90%.`
- Footer: `You are getting this because your Pictify account crossed 50% of its monthly plan. We send this once a month, at 50% and at 90%.`
- `daysLeft` is new data: days until `nextResetDate`.

## EM-04 Team invitation (`templates/team/invitation.ejs`, invite + reminder)

- Subject: `{inviterName} invited you to {teamName} on Pictify` · reminder: `{inviterName} is still waiting: {teamName} on Pictify`
- Preheader: `{INVITER} INVITED YOU TO {TEAM}'S PICTIFY TEAM. ACCEPT BY {EXPIRES}.` · reminder: `STILL OPEN UNTIL {EXPIRES}`
- Eyebrow: `TEAM INVITATION` (reminder: `TEAM INVITATION · REMINDER`) · H1: `{inviterFirstName} wants you on {teamName}'s team.` (reminder: `{inviterFirstName} is still waiting on you.`)
- Body: `{inviterName} ({inviterEmail}) invited you to the {teamName} team on Pictify. Accept and you get the team's templates, API keys and every render they make, in one shared workspace.`
- Button: `Join {teamName} on Pictify` → `{inviteUrl}`
- Line: `The invitation expires on {expiresAt}. If the button does nothing, paste this into your browser:` + link
- Rows, label `WHAT YOU GET`: `Shared templates and brand kit, edited by anyone on the team.` / `Team API keys, webhooks and one usage meter for everyone.`
- Footer: `You are getting this because {inviterEmail} invited this address. Not expecting it? Ignore it and nothing happens.`

## EM-05 Webhook paused (`templates/user/webhook-paused.ejs`)

- Subject: `Webhook paused: {event} stopped reaching {targetHost}`
- Preheader: `10 DELIVERIES IN A ROW NEVER GOT A 2XX. WE PAUSED IT; RENDERS ARE UNAFFECTED.`
- Eyebrow: `WEBHOOK PAUSED · {event}` · H1: `Your webhook is paused. Renders are fine.`
- Body: `Hi {userName}. We tried to deliver {event} to your endpoint 10 times in a row and never got a 2xx back, so we paused the subscription rather than keep retrying. Renders complete as normal; nothing reaches this URL until you reactivate it.`
- Ledger: TARGET `{targetUrl}` (mono) · LAST ERROR `{lastError}` (mono) · FAILED `10 of 10 deliveries` · PAUSED `{pausedAt}`
- Button: `Reactivate the webhook` → `https://pictify.io/dashboard/callers` (Webhooks tab)
- Line: `Fix the endpoint first, then reactivate from Callers › Webhooks. Paused events are not replayed; every render from the pause window is in your renders list with its URL.`
- Rows, label `USUAL CAUSES`: `Endpoint answering with a non-2xx status, or timing out after 10 seconds.` / `Expired TLS certificate, or a host that no longer resolves.`
- Footer: `You are getting this because you own the webhook subscription on this Pictify account.`

## EM-06 Overage invoice (`templates/user/overage-invoice.ejs` + reminders 3/6/7 day)

- Subject: `{amountFormatted} for {month}: {overageCount} renders over your plan`
- Preheader: `{OVERAGE} RENDERS OVER YOUR {MONTH} PLAN · {AMOUNT} DUE BY {DUE}.`
- Eyebrow: `OVERAGE INVOICE · {MONTH}` · H1: `{amountFormatted} for {overageCount} renders over plan.`
- Body: `Hi {userName}. In {month} the {teamName} team rendered {total} times against a {planLimit}-render {planName} plan. We kept rendering instead of stopping you at {planLimit}; this invoice covers the {overageCount} extra at {rate} each.`
- Ledger: PERIOD · IN PLAN `{planLimit} renders · {planName}` · OVER PLAN `{overageCount} renders × {rate}` · DUE `{dueDate}` · AMOUNT DUE `{amountFormatted}` (large)
- Button: `Pay {amountFormatted} now` → `{checkoutUrl}`
- Line: `Due {dueDate}. Still open after 7 days, new renders pause until it is paid and resume the moment it is. You can also pay from Usage & billing.`
- Rows, label `IF IT STAYS UNPAID`: `Day 3 a reminder · day 6 renders pause tomorrow · day 7 renders paused. The same button resumes them.` / `Never want an overage bill? Set a hard cap in Usage & billing and we stop at {planLimit} instead.`
- Footer: `You are getting this because you are the billing owner of the {teamName} team on Pictify.`
- Data gap: the template receives only `amountFormatted` and `overageCount`; `total`, `planLimit`, `rate` and `dueDate` must be passed by `scripts/generate-overage-invoice.js` / the reminder queue, or those rows are dropped.

### Reminder ladder (`overage-reminder-3day/6day.ejs`, `overage-service-stopped.ejs`)
| Day | Subject | Eyebrow | H1 | Button |
|---|---|---|---|---|
| 3 | `{amount} for {month} is still open` | `OVERAGE INVOICE · 3 DAYS OPEN` | `{amount} is still open. Four days before renders pause.` | `Pay {amount} now` |
| 6 | `Renders pause tomorrow: {amount} for {month}` | `OVERAGE INVOICE · PAUSES TOMORROW` | `Pay today or renders pause tomorrow.` | `Pay {amount} now` |
| 7 | `Renders paused: {amount} for {month} is overdue` | `RENDERS PAUSED · INVOICE OVERDUE` | `Renders are paused until {amount} is paid.` | `Pay {amount} and resume` |

Preheaders:
- Day 3: `{AMOUNT} FOR {MONTH} IS STILL OPEN. FOUR DAYS BEFORE RENDERS PAUSE.`
- Day 6: `RENDERS PAUSE TOMORROW UNLESS {AMOUNT} IS PAID.`
- Day 7: `RENDERS ARE PAUSED. PAY {AMOUNT} AND THEY RESUME AT ONCE.`

Body and ledger identical to the invoice; day 7 adds ledger row STATUS `Paused since {date}`.

## Not rewritten (not live)
trial-ending / trial-ended (cron dead), campaign/* drips (`DRIP_ENABLED` off), abuse-alert (internal), dormant-user-reminder (no caller), security-password-reset and out-of-beta (one-offs).
