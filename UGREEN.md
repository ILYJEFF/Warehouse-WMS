# UGREEN Docker Project

## Error: `Dockerfile: no such file`

You pasted **only the yaml**. The old file tried to **build** the app on the NAS, which needs the whole repo (`Dockerfile`, `src/`, etc.) in the project folder.

**Fix:** use the new **`docker-compose.ugreen.yml`** — it **downloads** the app image. No Dockerfile needed.

---

## Steps

1. **Docker** → **Project** → edit your project (or create new)
2. Replace the compose text with **`docker-compose.ugreen.yml`** from GitHub (copy all of it)
3. **Deploy**

4. On GitHub: **Warehouse-WMS** → **Actions** → wait for **Publish Docker image** to finish (first time only)

5. If pull fails with "denied": GitHub → **Packages** → **warehouse-wms** → **Package settings** → **Change visibility** → **Public**

---

## Cloudflare

`warehouse.techchefstx.work` → `http://192.168.0.24:3090`

Login: `dispatch@techchefstx.com` / `Oatmilk1769!`

---

## Alternative: build on NAS

Only if you copy the **entire repo** to the NAS project folder, use `docker-compose.ugreen.build.yml` instead.
