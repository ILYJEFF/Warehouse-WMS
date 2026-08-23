# Vercel deploy (optional — NAS is the main setup)

Vercel **cannot** use `192.168.0.24` for Postgres. You need a **cloud** database.

## Quick fix for warehousewms.vercel.app

### 1. Create free Postgres at [neon.tech](https://neon.tech)

Copy the connection string (starts with `postgresql://`).

### 2. Vercel → Project → Settings → Environment Variables

Add all of these:

| Name | Value |
|---|---|
| `DATABASE_URL` | your Neon connection string |
| `AUTH_SECRET` | any random string 32+ chars |
| `APP_URL` | `https://warehousewms.vercel.app` |
| `ADMIN_EMAIL` | `dispatch@techchefstx.com` |
| `ADMIN_PASSWORD` | your login password |
| `ADMIN_NAME` | `Dispatch` |
| `SEED_DEMO` | `true` |

### 3. Create tables (once, from your PC)

```powershell
cd wms
$env:DATABASE_URL="your-neon-connection-string"
npx prisma db push
npm run db:seed
```

### 4. Redeploy on Vercel

Deployments → Redeploy latest.

---

## Recommended: use NAS instead

`https://warehouse.techchefstx.work` via Docker on your NAS (see `REBUILD.md`).

No Vercel, no extra cloud database, same network as your shop.
