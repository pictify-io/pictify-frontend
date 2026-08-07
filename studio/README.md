# Pictify Sanity Studio

Content backend for the blog (and, in phase 2, block-based marketing pages).

## One-time setup

1. Create the Sanity project (free tier):

   ```bash
   cd studio
   npm install
   npx sanity init --env
   # → log in, "Create new project", name it "Pictify", dataset: production
   ```

   `sanity init --env` writes `SANITY_STUDIO_PROJECT_ID` + `SANITY_STUDIO_DATASET`
   into `studio/.env`.

2. Frontend env — **both** places, not just one:

   ```
   PUBLIC_SANITY_PROJECT_ID=<same project id>
   PUBLIC_SANITY_DATASET=production
   ```

   in `.env` at the repo root (for local dev), **and** in Cloudflare Pages →
   pictify → Settings → Environment variables (Production + Preview). The
   frontend reads these via `$env/dynamic/public`, which on
   `adapter-cloudflare` resolves from the platform's env at request time —
   the repo's `.env` files never reach the deployed Worker. Setting only the
   repo file looks like a cutover but silently keeps serving the legacy
   Mongo-backed API in production.

   While unset in Cloudflare Pages, the blog routes fall back to the legacy
   API — flipping the Pages env vars is what actually cuts over (no rebuild
   needed, since `$env/dynamic/public` is read per-request).

3. Migrate the 18 existing posts (run on the VPS where Mongo lives):

   ```bash
   # in the html-to-gif repo
   SANITY_PROJECT_ID=<id> SANITY_DATASET=production SANITY_TOKEN=<write token> \
     node scripts/migrate-blogs-to-sanity.js
   ```

   Create the write token at sanity.io/manage → API → Tokens → "Editor".
   The script is idempotent (deterministic document IDs) — safe to re-run.

4. Deploy the studio so you can edit from anywhere:

   ```bash
   npm run deploy   # hosts at https://pictify-blog.sanity.studio
   ```

   Or run it locally with `npm run dev` (http://localhost:3333).

   The CLI needs its own login (`npx sanity login`), separate from the MCP
   connection — it's a browser OAuth flow, same account. `sanity.cli.js`
   pins the project id/dataset and `studioHost` so redeploys don't prompt.

## Publishing flow after cutover

Write/edit in the studio → Publish. The frontend reads Sanity's CDN on every
request — no deploy needed for content changes. New posts appear on /blogs and
in sitemap-blogs.xml automatically.
