# SEO gap strategy — 2026-08-22

Sources: Google Search Console (`sc-domain:pictify.io`, 16 months + two 30-day windows Jun 22–Jul 21 vs Jul 22–Aug 21) and DataForSEO Labs (competitors_domain, ranked_keywords for pictify + htmlcsstoimage, bannerbear, placid, urlbox, screenshotone, apiflash; US/en). Raw JSON in the session scratchpad.

## 1. Diagnosis — what actually dropped

Monthly clicks: Feb 1,985 → Mar 1,782 → Apr 1,525 → May 1,666 → Jun 1,862 → Jul 2,023 → Aug ~1,650 (projected from 21 days). Avg position Jul 16.4 → Aug 21.6.

Window diff (A → B): 1,988 → 1,715 clicks (−273). **−218 of that is one page, `/tools/url-to-image-generator`** (1,204 → 986; position 15.0 → 19.6; impressions UP 17k → 19.8k). Query losers are all its cluster: "link to image" −82, "link to photo" −35, "url to image" −34, "url to photo" −16. `og-image-generator` −50, `html-to-png` −30; everything else is noise. The Aug 8 purge/301s are not the cause — purged URLs still 301 sensibly and carried <15 clicks.

**Root cause: intent mismatch.** DataForSEO's competitor list for pictify.io is image-hosting sites — image2url.com, postimages.org, imgbb.com, phototourl.com, imghippo.com — not HCTI/Bannerbear. Pictify's highest-volume rankings are "pic url" (12.1k, KD100), "image url generator/maker/creator" (3×2,400), "photo url generator" (2,400), "picture url generator" (2,400), "link image generator" (1,300), "create image url" (720): every one is *upload a photo, get a link* intent. The page is a *URL → screenshot* tool. Google is re-sorting the SERP toward hosting sites and the page is sliding (avg pos 15 → 19.6 with impressions rising = shown more, clicked less). This will keep sliding unless the intent is served.

## 2. Fixes, in order of expected clicks

### A. (DROPPED 2026-08-22) Image-hosting intent
Owner decision: Pictify does not do image hosting (that is Cloudinary's business). The "pic url / image url generator" cluster that `/tools/url-to-image-generator` currently ranks for is upload-a-photo-get-a-link intent and will keep leaving as Google re-sorts the SERP. Accept the loss; do not build `/tools/image-to-url`. Expect the URL tool to settle lower on that cluster — the recovery comes from B, not from chasing hosting.

### B. Re-target `/tools/url-to-image-generator` to the screenshot cluster
screenshotone.com owns it with two tool pages (`/tools/full-page-website-screenshot/` ranks top-5 for ~100 keywords). Keywords pictify is absent from, all KD 15–25: screenshot entire webpage 2,400 · screenshot an entire webpage 2,400 · full webpage screenshot 1,600 · how to screenshot whole webpage 1,000 · how to screenshot entire webpage 880 · how to screenshot an entire webpage 720 · how to take a screenshot of a full webpage 480 · website screenshot 2,400 (KD61). Action: add a **full-page mode** to the URL tool, retitle H1 toward "Website Screenshot Generator — full page", keep the url-to-image H2s/FAQ, add an FAQ block answering the "how to screenshot entire webpage" questions (that's how screenshotone wins the how-to queries). One page, ~12k monthly volume, low KD.

### C. Certificate cluster — Bannerbear owns it with one page
`bannerbear.com/generators/free-online-certificate-generator/` ranks #1–6 for 32 keywords: certificate generator 590 (#1) · certificate maker 1,900 (#3) · make a certificate 1,900 (#4) · certificates maker 1,900 (#4) · certificate creator 720 (#1) · create a certificate 720 (#3) · free certificate maker 590 · certificate creator free 590 · online certificate maker 390 (#1) · generate certificate 480 (#1). Pictify's `/tools/certificate-generator` ranks 30 for "certificate generator free" (590) and 45 avg in GSC. It's the wedge product per positioning — this is the gap to close: rewrite the page's SEO copy around "certificate maker / make a certificate" (H2s + FAQ), add 5 visible template previews (Bannerbear's page is template-first), and get 3–5 links (existing AEO off-site tracker). ~10k monthly volume, KD 22–49.

### D. Striking-distance pushes (position 4–20, no new pages)
- html to png 2,900 KD0 — pos 11 but the ranking URL is `/html-to-png/1080x1920`, not the canonical page. Make `/tools/html-to-png` the canonical for the head term (internal links + title), keep size pages for size queries.
- html to image 5,400 KD8 / html-to-image 5,400 — pos 25–30 on `/html-to-png`. `/tools/html-to-image` exists (hub links it) — make it the head page with its own title/H1; currently html-to-png is absorbing it.
- code to image 2,400 KD52 / code image 2,400 KD27 — pos 16–20; `/tools/code-to-image` (migration in progress — include the "code image" phrasing in H2/FAQ).
- image to html 2,400 KD7 / picture to html code 1,000 KD8 — HCTI ranks 18–20 only; nobody owns it. Cheap blog/tool page ("Image to HTML: how to turn a design into markup" + AI template maker angle).
- generate banner 6,600 KD14 — Bannerbear pos 16 only. `/tools/linkedin-banner-generator` exists; a generic `/tools/banner-generator` or retitling the LinkedIn page's H2s could take it.
- twitter screenshot 720 / screenshot twitter 720 KD0–1 — pos 10; tweet-screenshot v2 is live, push with internal links + FAQ.
- open graph image generator 320 KD12 — pos 12.
- orshot 3,600 — pos 11 on `/alternatives/orshot` (competitor brand query; leave, but keep the page).

### E. Hygiene (no content work)
- `/alternatives/hcti-io` (pos 7.3, top alternatives URL) 301s to the index → point at `/alternatives/html-css-to-image`. Already sent to the implementation session.
- Brand query "pictify ai" dropped 4 → 0 clicks (pos 1.3 → not shown): check the homepage title still contains "Pictify" prominently after the landing v2 ship.
- Every tool page v2 keeps headings frozen; the changes above are *additions* (FAQ blocks, modes, new pages), consistent with the frozen-copy rule.

## 3. What NOT to chase
Wayback/archive cluster (urlbox, 1M+ vol) — not our product. Chrome-extension screenshot cluster (screenshotone) — would need an extension. Claude/Cursor/ffmpeg install queries (bannerbear blog) — irrelevant traffic. Photo collage (bannerbear) — off-positioning.

## 4. Sequence
1. Fix `/alternatives/hcti-io` redirect (minutes).
2. Full-page mode + FAQ block on `/tools/url-to-image-generator` (with its v2 migration, which is already first in the implementation queue).
4. Certificate page copy + template previews + links.
4. html-to-image / html-to-png canonical split; code-to-image phrasing.
5. image-to-html and banner-generator pages.

Measure: GSC weekly, page-level, for the four URLs in A–D. Success = url-to-image holds ≥800/mo on screenshot-intent queries (hosting-intent clicks will fall), certificate-generator ≥100/mo, html-to-image/html-to-png combined ≥1,200/mo, by week 8.

## 5. Superseded
The earlier §5 (product support for image→URL: guest upload endpoint, /v1/uploads, Uploads tab) is withdrawn — no image hosting in the product. The copy decision in it still stands: the no-email-delivery constraint outranks the copy freeze on ranked surfaces; rewrite the 12 remaining mentions on certificate-generator and csv-to-pdf with headings intact.

## 6. Full-page mode — design done
Paper board **"URL tool — full-page mode (spec)"** = `ALG-0`: capture-mode pills (Viewport / Full page / Element) in the URL bar, options column (device, scroll-to-load, hide cookie banners, wait for network idle, max height), tall preview with a scroll-position bar, toolbar with PDF added and "Capture full page". Plus four FAQ additions (append to the live FAQ; add to FAQPage JSON-LD) and title/meta notes. Backend: expose `fullPage` on the render endpoint — `service/puppeteer-browser-adapter.js` already supports it, `service/html-renderer.js:196` hard-codes `false`.

## 7. Video clusters (DataForSEO, 2026-08-22)

What exists, with who currently ranks:
| Keyword | Vol | KD | CPC | SERP today |
|---|---|---|---|---|
| html to video | 1,300 | 36 | $1.93 | online-convert, aconvert, w3schools, YouTube, a Chrome extension, grabz.it, html2.video — no serious product |
| html to mp4 | 880 | 14 | — | same weak set |
| html to mp4 converter | 210 | 23 | $2.45 | same |
| html to gif | 590 | 0 | — | convertio, online-convert, aspose — generic file converters |
| html to animated gif | 590 | 0 | — | same |
| automate video editing | 480 | 16 | $4.49 | — |
| ai video generation api | 260 | 15 | $18.76 | — |
| video api | 210 | 62 | $41.30 | conferencing/streaming APIs dominate |
| programmatic video | 140 | 0 | $33.95 | — |
| video automation | 140 | 15 | $7.35 | — |
| gif api / animated gif api | 140 / 140 | 25 / 7 | — | — |
| json to video | 90 | 0 | — | json2video |
| video generation api | 90 | 22 | $48.73 | — |
| text to video api | 70 | 12 | — | — |
| lottie to mp4 | 70 | 0 | — | — |
| website to video | 70 | 22 | $5.92 | — |

Not ours: "image to video" 27k (AI animation — Adobe/Canva/HeyGen), "video to mp3"/downloaders (shotstack's free-tool farm), "personalized video" (Santa/celebrity messages).

**Play:** one free tool page, `/tools/html-to-mp4` (with `/tools/html-to-video` as the H1-variant or a redirect), built on the video studio renderer — paste HTML/CSS animation → MP4/GIF/WebM. The "html to video / html to mp4 / html to gif / html to animated gif" set is ~3.4k monthly at KD 0–36 against file-converter sites that can't actually render CSS animation. Same ToolPageShell, column mode; the result card's "Copy API request" carries `format: "mp4"`. Second page later: `/tools/lottie-to-mp4` (KD0) if Lottie rendering is supported. Developer head terms ("video generation api", "programmatic video") are tiny in volume but $34–49 CPC — worth owning via the docs and one blog post, not a tool page.

Sequence insert: html-to-mp4 tool after the certificate work (it's the only video item with real volume and a weak SERP).
