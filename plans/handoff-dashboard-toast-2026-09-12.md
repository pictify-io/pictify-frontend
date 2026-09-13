# Handoff — Dashboard toast: failures must say so (design → implementation)

Date: 2026-09-12. User: "Inside the product when clicking on render or other items if it fails we
don't show any message. We need to implement toast inside the dashboard."

## Source of truth

Paper file `01KZQXXEZ2SNPWS5PN2FCF31PC`, board **Dashboard TO-01 — Toast (v2)** `MQ8-0`: anatomy,
the three kinds, placement, and the "which surface" table. Read it with `get_jsx` for exact values.
Studio save-state pills are on `GTP-0` S1 and stay as they are.

## Why it is silent today (verified on worktree-redesign-v2)

1. **The API wrappers swallow.** `src/service/backend.js` throws a proper `HttpError` (status, message,
   body), but 23 wrappers catch it and `return null`: `template.js` ×18 (getTemplates, getTemplateById,
   createTemplate, updateTemplate, deleteTemplate, searchTemplates, getTemplatesForType,
   getTemplateVariables, cancelBatchJob, regenerateThumbnail, regenerateAllThumbnails,
   validateExpression, testExpression, interpolateText, getExpressionFunctions, getPublicTemplates,
   getPublicTemplate, forkTemplate), `user.js` ×3 (getUser, getApiToken, getPlanDetails),
   `billing.js` getSubscription, `image.js` getGuestRenderQuota. A caller that `await`s
   `deleteTemplate(uid)` then removes the row from its list never sees the failure: the template is
   still there after reload. (Memory: "API wrappers swallow errors".)
2. **The toast is mounted per page, not in the shell.** `src/lib/components/Toast.svelte` is
   imported in 20 files. Six dashboard surfaces call `showToast` with no `<Toast />` in their tree,
   so the call is a no-op: `integrations/ConnectorConfigs.svelte`, `integrations/WebhookSubscriptions.svelte`,
   `team/TeamMembers.svelte`, `team/TeamSettings.svelte`, `studio/TemplateStudio.svelte`,
   `routes/dashboard/template/[uid]/render/+page.svelte`. Pages that do mount it get a v1 toast
   (3 px grey border, colour strip, "Success"/"Error" titles, bottom-centre) that predates the
   redesign.
3. **Some failures are caught and written to a variable nobody renders.** `template/+page.svelte`
   and `renders/+page.svelte` set `errorMessage` and do render it inline (fine for load failures),
   but action failures on those pages (delete, duplicate) land in the same inline slot at the top of
   the page, off-screen when the row is at the bottom.

## What to build

### 1 · Mount once

- Render `<Toast />` (rewritten, §3) exactly once, in `src/routes/dashboard/+layout@.svelte`,
  `src/routes/template-workspace/+layout*` (or the two `html/[uid]` and `html/create` routes if no
  layout exists) and `src/routes/campaign-studio/[uid]/+page.svelte`. Remove the 20 per-page
  `<Toast />` mounts and imports. Marketing tool pages (`/tools/*`) keep theirs until the tool shell
  is touched separately; do not regress them.

### 2 · A notify API on the store (replace `showToast(message, type, duration)`)

`src/store/toast.store.js` keeps the queue (max 3 visible, newest at the bottom) and gains:

```js
notify.fail(action, err, { retry?: () => Promise<void>, id?: string })
// action: 'Render' | 'Delete' | 'Save' | 'Invite' … (the verb the user clicked, sentence case)
// eyebrow  = `${action.toUpperCase()} FAILED` + (err?.status ? ` · ${err.status}` : '')
// message  = humanize(err) — err.data?.message → err.message → fallback per action
// kind 'fail' never auto-dismisses; RETRY shown only when retry is passed; COPY ERROR ID when
//   err.data?.requestId || err.data?.id exists
notify.done(eyebrow, message)        // kind 'ok',   3 s  — only for results not visible on the page
notify.note(eyebrow, message)        // kind 'note', 4 s  — things that happened elsewhere
```

`humanize(err)`: 401 → "Your session ended. Sign in again." (and let the existing auth redirect
run); 403 → server message or "You don't have permission for that."; 404 → "That no longer
exists. Reload the page."; 409 → server message; 429 → **no toast**, the upgrade modal handles it
(`maybeHandleQuota` already fires; `notify.fail` must return early when `err.data?.code ===
'quota_exceeded'`); 5xx / network → "The server did not answer. Nothing was changed." (renders:
"Nothing was billed."). Keep `showToast` as a thin shim over `notify.note` for the tool pages.

### 3 · The component (board TO-01)

- Paper surface, `border-[1.5px] border-brand-ink rounded-[12px]`, `shadow-[4px_4px_0_0_#000]`,
  400 px max width, `py-3.5 px-4`. Left: 8 px square, `bg-brand-proof` for ok, `bg-brand-ink` for
  note, brick `#C8342A` for fail (add as `brand-danger` if the token differs; do not use pink, pink
  is decorative on this site). Eyebrow mono 10 px 0.06em ink. Message Inter 14/20 ink, one
  sentence. Action row: mono 11 px links, `RETRY` royal, `COPY ERROR ID` mute. Dismiss `×` mono
  mute top-right; ok/note show their remaining seconds in mono mute instead.
- Fixed bottom-right, 24 px from both edges, `z-[60]` (DESIGN.md scale). Column, newest at the
  bottom, 6 px gap, a fourth arrival drops the oldest. Below 640 px: full width with 16 px gutters.
  Enter: translateY(8px)→0 + opacity, 180 ms; exit 120 ms; none under `prefers-reduced-motion`.
- a11y: the container is `aria-live="polite"`; a fail toast is `role="alert"`; ok/note are
  `role="status"`. Focus is never moved to the toast. `Esc` dismisses the newest fail toast when
  nothing else owns Esc (modal open → modal wins). Hovering a timed toast pauses its timer.

### 4 · Stop swallowing

- In the 23 wrappers above: remove the `try { … } catch { return null }` and let `HttpError`
  propagate. Where a caller legitimately wants "null on 404" (getTemplateById on a deleted uid),
  handle it at the call site.
- Grep for every `await <wrapper>(` in `src/routes/dashboard`, `src/lib/components/dashboard`,
  `src/lib/components/studio` and `src/routes/template-workspace`, and make each action handler:

```js
try { await deleteTemplate(uid); templates = templates.filter(...) }
catch (err) { notify.fail('Delete', err, { retry: () => handleDelete(event) }) }
```

  The optimistic mutation happens only after the await resolves. Page-load fetches keep their
  inline `errorMessage` rendering (renders, templates) and do not toast.

### 5 · Call sites that must be wired (minimum)

| Surface | Action | Today | After |
|---|---|---|---|
| Studio (`template-workspace/html/[uid]`) | Render (`onRender`) | inline `renderError` in the proof area only | keep inline + `notify.fail('Render', err, { retry })` |
| Studio | Save / autosave | S1 pill | unchanged (pill), no toast |
| Templates list | Delete, Duplicate | `errorMessage` at page top | `notify.fail('Delete' / 'Duplicate', err, { retry })`; row stays |
| Renders | Delete render, Re-render, Download | silent / partial | fail toast with retry; Download failure toast without retry |
| API keys | Create, Revoke, Copy | v1 toast on some | ok toast on Copy only; fail toasts with retry on Create/Revoke |
| Team | Invite, Remove, Role change | `showToast` with no mount on `TeamMembers` | ok toast "INVITE SENT · maya@… has 7 days"; fail toasts |
| Callers / Webhooks tab | Add, Test, Delete | `showToast` with no mount | ok toast on Test delivered; fail toasts |
| Brand assets | Upload, Save kit | v1 toast | fail toasts; no ok toast (the asset appears) |
| Billing | Open portal, Change plan | `catch (e)` silent | fail toasts; note toast "PORTAL OPENING · in a new tab" |
| Campaign studio, Campaigns editions | Generate, Export, Approve | mixed | fail toasts with retry where the action is idempotent (Generate is not: no retry, message says how many succeeded) |

### 6 · Acceptance

- With the backend stopped (or `PUBLIC_BACKEND_URL` pointed at a dead port), every action in §5
  produces one fail toast naming the action and status; no list row disappears; no page shows a
  blank result as if it worked.
- Force a 403 on delete (a member on a team template): toast reads "DELETE FAILED · 403 / Only an
  owner can delete "<name>". It is still here." and the row remains.
- Render in the studio against a 502: proof area shows the inline failure AND the toast; RETRY
  re-runs `onRender` once.
- Trigger a 429: upgrade modal opens, no toast.
- Fire four notifications in a row: three visible, oldest dropped, newest at the bottom; `Esc`
  dismisses the newest fail; a timed toast's countdown pauses on hover.
- `<Toast />` appears exactly once in the DOM on `/dashboard`, `/dashboard/template`, the studio
  route and the campaign studio; `grep -rn "<Toast" src/routes/dashboard src/lib/components/dashboard`
  returns nothing but the layout.
- svelte-check clean; `node --test 'src/**/*.test.js'` passes; add unit tests for `humanize()` and
  the queue (max 3, order, fail never expires).

### 7 · Out of scope

The tool pages' toasts (`/tools/*`), the S1 save pills, the upgrade modal, backend error bodies.

## Worktree rules

Shared worktree with concurrent sessions: never `git stash`, never `git add -A`; stage only your
own hunks; `git status` before committing. This session's uncommitted files in the tree
(workflows retirement, `scripts/blog-cover.py`, `plans/og-images-2026-09-12.md`) are not yours to
stage.
