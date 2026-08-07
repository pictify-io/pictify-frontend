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

2. Frontend env (`.env` at repo root and in Cloudflare Pages settings):

   ```
   PUBLIC_SANITY_PROJECT_ID=<same project id>
   PUBLIC_SANITY_DATASET=production
   ```

   While these are unset, the blog routes silently fall back to the legacy
   Mongo-backed API — merging this branch changes nothing until you flip the env.

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
   npm run deploy   # hosts at https://<something>.sanity.studio
   ```

   Or run it locally with `npm run dev` (http://localhost:3333).

## Publishing flow after cutover

Write/edit in the studio → Publish. The frontend reads Sanity's CDN on every
request — no deploy needed for content changes. New posts appear on /blogs and
in sitemap-blogs.xml automatically.
