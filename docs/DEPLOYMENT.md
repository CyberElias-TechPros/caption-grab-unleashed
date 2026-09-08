# Deployment Guide — Vercel (frontend) + Cloudflare (API)

## 0. Prerequisites

- Node.js 20+, npm
- A Cloudflare account (free tier is enough)
- A Vercel account (free tier is enough)
- This repository cloned locally

## 1. Deploy the API (Cloudflare Worker)

```bash
cd worker
npm install
npx wrangler login          # opens Cloudflare OAuth in your browser
npm run deploy              # → https://captiongrab-api.<subdomain>.workers.dev
```

Save the `workers.dev` URL — Vercel needs it in step 2.

**Verify:**

```bash
curl "https://captiongrab-api.<subdomain>.workers.dev/api/health"
# {"ok":true,"service":"captiongrab-api",...}

curl "https://captiongrab-api.<subdomain>.workers.dev/api/video?id=8jPQjjsBbIc"
# {"videoId":"8jPQjjsBbIc","title":"...","tracks":[...]}
```

**Optional hardening** (`worker/wrangler.toml` → redeploy):

```toml
[vars]
ALLOWED_ORIGINS = "https://captiongrab.app,https://www.captiongrab.app"
RATE_LIMIT_PER_MINUTE = "30"
```

> No bindings (D1/R2/KV) and no secrets are required. `wrangler deploy` works on a brand-new
> account with zero dashboard setup.

## 2. Deploy the frontend (Vercel)

### Option A — Dashboard (recommended)

1. Vercel → **Add New → Project** → import `caption-grab-unleashed`.
2. Framework preset: **Vite**. Build command `npm run build`, output `dist/` (auto-detected).
3. **Environment Variables** → add:
   - `API_WORKER_URL` = `https://captiongrab-api.<subdomain>.workers.dev` (from step 1)
   - Scope: Production (and Preview if you want previews to work end-to-end).
4. **Deploy.**

`vercel.json` automatically:
- rewrites same-origin `/api/*` → your Worker (no CORS, no `VITE_*` needed),
- falls back all other routes to `index.html` (SPA routing),
- adds security headers and immutable caching for `/assets/*`.

### Option B — CLI

```bash
npm i -g vercel
vercel link
vercel env add API_WORKER_URL production   # paste the Worker URL
vercel --prod
```

## 3. Post-deploy checklist

- [ ] `https://<your-app>.vercel.app/api/health` returns `{"ok":true,…}` (rewrite works)
- [ ] Paste a YouTube link → tracks load → transcript extracts
- [ ] Export TXT/SRT/VTT downloads correctly
- [ ] `/about`, `/privacy`, `/terms` render; unknown route shows the 404 page
- [ ] Toggle dark/light theme; test on a phone viewport
- [ ] `npx wrangler tail --cwd worker` shows clean logs while extracting

## 4. Custom domain (optional)

1. Vercel → Project → **Settings → Domains** → add `captiongrab.app` (+ `www`), follow DNS steps.
2. Update `index.html` canonical URL, `public/sitemap.xml` and `ALLOWED_ORIGINS` in
   `worker/wrangler.toml`, then redeploy both.

## 5. Local development

```bash
npm install
npm run worker:dev   # terminal 1 → API on :8787
npm run dev          # terminal 2 → app on :8080, /api/* proxied to :8787
```

To point the frontend at the **deployed** Worker instead, create `.env` from `.env.example`
and set `VITE_API_URL=https://captiongrab-api.<subdomain>.workers.dev`.

## 6. Rollback

- **Frontend:** Vercel → Deployments → promote any previous deployment (instant).
- **API:** `npx wrangler rollback --cwd worker` (or redeploy a previous git tag).

## 7. Cost estimate

Both tiers' free allowances cover a side-project comfortably: Cloudflare Workers free plan
(100k req/day) + Vercel hobby (100 GB bandwidth). No databases to pay for.
