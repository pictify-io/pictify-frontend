# QA-23 — the external-tool rehearsal

Spec §13, QA-23: *"Actual external-tool preview for two different accounts;
imagery disabled → Correct recipient/account join; text/CTA still readable;
private Pictify URLs not pasted as email hosts."*

This is deliberately a test of the **handoff**, not of Pictify. Pictify renders;
the buyer's tool sends. So the rehearsal has to happen inside a real sending
tool, with real files, by hand — which is the point.

## What is already done

Two synthetic profiles exist in the Customer.io workspace, created through the
Track API:

| id | email | account | name | workflows | hours |
|---|---|---|---|---|---|
| `v3-qa-a` | v3-qa-a@pictify.test | `00001` | Contoso Freight 0 | 1,284 | 312.4 |
| `v3-qa-b` | v3-qa-b@pictify.test | `00002` | 株式会社ファブリカム | 2,041 | 501.2 |

They differ in **every visible field**, including the script the name is written
in, so a join failure is unmissable rather than subtle. Each carries a
`card_url` attribute pointing at its own card.

`email.html` in this folder is the message: Customer.io Liquid, referencing
`{{customer.card_url}}`, with an `alt` that repeats the same company and the same
figures, a text block that renders whether or not images load, and a **text**
CTA rather than an image button.

The three PNGs are real output from the QA-25 rehearsal — the same renderer,
the same pipeline. `card-00003-longname.png` is included as the overflow case
(a 64-character name that wraps to two lines).

## The four steps left, in the Customer.io UI

1. Upload `card-00001-contoso.png` and `card-00002-fabrikam.png` somewhere the
   email can fetch them, and update each profile's `card_url` to the uploaded
   address. **This step is the test** — see the finding below.
2. Create a broadcast/newsletter, paste `email.html` into a Code editor block.
3. Preview as `v3-qa-a`, then as `v3-qa-b`. Check: the card shown is that
   account's card, the `alt` names the same company as the picture, and the
   figures in the text match the figures in the image.
4. Disable images in the preview (or view the plain-text alternative). Check the
   company, both figures, the estimate disclosure and the CTA are all still
   readable.

Screenshots of steps 3 and 4, for both profiles, complete QA-23.

## Finding: a private artifact URL is not private

The profiles currently point at Pictify campaign artifact URLs, because that is
what a buyer would naively paste. **It works** — and that is the defect.

```
GET https://htgf.s3.amazonaws.com/campaigns/<team>/<edition>/<slug>.png   → 200
GET https://media.pictify.io/campaigns/<team>/<edition>/<slug>.png        → 200
```

No credentials, no session. Measured against a live artifact during the QA-25
rehearsal.

Campaign artifacts are supposed to be private with authenticated downloads
(BE-2, INV private storage). Two things combine to break that:

- `putArtifact` sets no ACL, so an object inherits the bucket default; and
- `CAMPAIGN_ARTIFACT_BUCKET` is unset, so campaign artifacts land in
  `AWS_BUCKET_NAME` — the same public media bucket as ordinary renders.

The bucket is **not** publicly listable (`ListBucket` → 403) and the key carries
a 128-bit random slug, so artifacts cannot be enumerated. `artifactUrl()` has no
callers, so the product never surfaces a direct URL. The exposure is therefore
"unguessable but permanently public once a key is known" rather than "browsable".

Why it still matters, in QA-23's own terms: the check exists because a buyer
pasting an artifact URL into an email is a mistake. Today that mistake
**silently succeeds** in preview and in testing, then breaks for real recipients
the moment retention expires and the object is purged — the worst possible time
and the hardest place to debug. If the object were actually private, the mistake
would fail loudly at preview, which is the whole point of the invariant.

Recommended fix, in order of value:

1. Set `CAMPAIGN_ARTIFACT_BUCKET` to a private bucket. One env var; the storage
   module was written to expect exactly this (see its header comment).
2. Until then, pass `ACL: 'private'` in `putArtifact` so campaign objects do not
   inherit a public bucket default.
3. Delete `artifactUrl()`. It has no callers and its only possible use is the
   mistake above.

Note this is a **deployment configuration** finding, not a code defect in R1 —
the authenticated gateway, the purge lifecycle and the key layout are all built
correctly. Nothing here was changed: production infrastructure is read-only for
this session.
