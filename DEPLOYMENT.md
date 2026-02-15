# Deployment Guide: Vercel + Render

## Prerequisites

- GitHub repo with the project
- Vercel account
- Render account
- Instantly & PlusVibe API keys (optional for demo)

---

## 1. Deploy Backend to Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Name:** `unified-inbox-api`
   - **Root Directory:** (leave empty – uses repo root)
   - **Build Command:** `npm install && npm run build:api`
   - **Start Command:** `node apps/api/dist/index.js`
   - **Instance Type:** Free (or paid for Redis)

4. **Add PostgreSQL:**
   - New → PostgreSQL
   - Copy the **Internal Database URL** (for Render services) or **External** (for local access)

5. **Environment Variables** (Render dashboard → Environment):
   ```
   DATABASE_URL=<from Render PostgreSQL>
   REDIS_URL=<optional - add Redis add-on for webhooks>
   JWT_SECRET=<generate a strong random string>
   CORS_ORIGINS=https://your-app.vercel.app
   INSTANTLY_API_BASE=https://api.instantly.ai
   PLUSVIBE_API_BASE=https://api.plusvibe.ai/api/v1
   OPENAI_API_KEY=<your key>
   ```

6. Deploy. Note your API URL: `https://unified-inbox-api.onrender.com`

7. **Run migrations** (one-time):
   - Use Render Shell or locally with `DATABASE_URL` set to Render DB:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:push
   ```

---

## 2. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New → Project
2. Import your GitHub repo
3. Configure:
   - **Root Directory:** `apps/web` (or leave empty and set in config)
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (or `cd apps/web && npm run build`)
   - **Output Directory:** `.next`

4. **Monorepo:** Set **Root Directory** to `apps/web` in Vercel project settings. This uses the web app's `package.json` and `next.config.js` directly.

5. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://unified-inbox-api.onrender.com
   ```

6. Deploy. Note your frontend URL: `https://your-app.vercel.app`

---

## 3. Update CORS

In Render, set:
```
CORS_ORIGINS=https://your-app.vercel.app
```

Redeploy the API if needed.

---

## 4. Webhooks (Instantly & PlusVibe)

Use your Render API URL:
- **Instantly:** `https://unified-inbox-api.onrender.com/api/webhooks/instantly`
- **PlusVibe:** `https://unified-inbox-api.onrender.com/api/webhooks/plusvibe`

---

## 5. Post-Deploy

- **Render Free Tier:** API may sleep after ~15 min inactivity. First request can be slow.
- **Redis:** Add Render Redis add-on for webhook deduplication and queue (optional).
- **Seed demo data:** Run `npm run seed:demo` against production DB (use Render Shell or connect locally with external DB URL).
