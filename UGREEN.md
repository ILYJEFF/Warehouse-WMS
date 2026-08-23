# UGREEN Docker Project — where do env vars go?

There is **no separate paste box** for those variables in most UGREEN setups.

You have **two options**. Pick one.

---

## Option A — easiest: one file, no env vars

Use **`docker-compose.ugreen.yml`** instead of `docker-compose.yml`.

Everything is already written inside the yaml. You only paste **one file**.

### Steps

1. On the NAS, **Files** app → `shared/docker` → create folder **`wms`**
2. Clone or copy the **whole** GitHub repo into that folder  
   (must include `Dockerfile`, `package.json`, `src/`, etc.)
3. **Docker** app → **Project** → **Create**
4. **Name:** `wms`
5. **Path / directory:** pick `shared/docker/wms` (the folder with the code)
6. **Compose:** open `docker-compose.ugreen.yml` on your PC, copy **all of it**, paste into the compose editor
7. Click **Deploy**

Done. No `.env`. No env var list.

---

## Option B — use a `.env` file (if you use `docker-compose.yml`)

Those lines do **not** go in the compose yaml editor.

They go in a **text file on the NAS**:

1. **Files** app on the NAS
2. Open the **same folder** as your Docker project (e.g. `shared/docker/wms`)
3. **New file** → name it exactly: **`.env`**  
   (On UGREEN it may disappear after save because it is hidden. That is normal.)
4. Paste this inside:

```
POSTGRES_USER=wms
POSTGRES_PASSWORD=Oatmilk1769!
POSTGRES_DB=wms
AUTH_SECRET=techchefs-wms-change-me-to-32chars-min
APP_URL=https://warehouse.techchefstx.work
ADMIN_EMAIL=dispatch@techchefstx.com
ADMIN_PASSWORD=Oatmilk1769!
ADMIN_NAME=Dispatch
SEED_DEMO=true
```

5. **Docker** → **Project** → path = that folder → compose = `docker-compose.yml` → **Deploy**

Docker reads `.env` from the project folder automatically. You never paste env vars into the yaml box.

---

## Cloudflare (separate)

Not in Docker. In **Cloudflare Zero Trust** → **Tunnels**:

`warehouse.techchefstx.work` → `http://192.168.0.24:3090`

---

## If build fails

The project **path** must be the full repo folder (with `Dockerfile`), not an empty folder with only yaml pasted.
