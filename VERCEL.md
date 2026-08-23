# Vercel + Neon (production)

Vercel cannot talk to your NAS (`192.168.0.24`). Use **Neon** for Postgres.

## 1. Create the database (Neon)

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign in
2. **New Project** → name it `warehouse-wms` → region close to you (e.g. US East)
3. Open the project → **Connection details**
4. Copy the connection string (starts with `postgresql://…`)
   - Use the one labeled **pooled** / includes `-pooler` if Neon shows both
   - Keep `?sslmode=require` on the end (Neon includes it)

## 2. Add env vars in Vercel

Vercel → your project → **Settings** → **Environment Variables**  
Add for **Production** (and Preview if you want):

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon connection string from step 1 |
| `AUTH_SECRET` | long random string (32+ chars) |
| `APP_URL` | `https://warehousewms.vercel.app` (or your custom domain) |
| `ADMIN_EMAIL` | `dispatch@techchefstx.com` |
| `ADMIN_PASSWORD` | your login password |
| `ADMIN_NAME` | `Dispatch` |
| `SEED_DEMO` | `true` (first deploy only; set `false` later) |

## 3. Create tables + seed (from your Mac)

In this repo folder:

```bash
cp .env.example .env
```

Edit `.env` so `DATABASE_URL` is your Neon string, then:

```bash
npm install
npx prisma db push
SEED_DEMO=true npm run db:seed
```

Login after seed:

- Email: `dispatch@techchefstx.com`
- Password: whatever you set in `ADMIN_PASSWORD` / seed env

## 4. Redeploy Vercel

**Deployments** → latest → **Redeploy** (or push a commit to `main`).

Open `https://warehousewms.vercel.app` and sign in.

## Local `npm run dev` against Neon

Same `.env` with Neon `DATABASE_URL` works for local dev. You do not need Docker Postgres.

## If login shows “Database not configured”

- `DATABASE_URL` is missing, wrong, or still points at `192.168.0.24`
- Redeploy after saving env vars (Vercel only injects them on a new deploy)
- Run `prisma db push` once against that same URL
