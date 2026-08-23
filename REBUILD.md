# Deploy WMS on UGREEN

## Step 1 — Make the zip on your PC

```powershell
cd "C:\Users\Jeffrey Hammitt\Desktop\Techchefs CRM\wms"
.\make-deploy-zip.ps1
```

This creates **`wms-deploy.zip`** in the `wms` folder.

## Step 2 — Upload to NAS

1. UGREEN **Files** → `shared/docker/`
2. Upload **`wms-deploy.zip`**
3. **Extract** it to `shared/docker/wms/`
4. Confirm **`Dockerfile`** is inside that folder

## Step 3 — Docker Project

1. **Docker** → **Project** → **Create** (delete old broken one first)
2. Name: `wms`
3. **Path:** `shared/docker/wms`
4. Compose file: `docker-compose.yml` (default)
5. **Deploy** — first build takes ~5 minutes

## Step 4 — Test

- http://192.168.0.24:3090
- Login: `dispatch@techchefstx.com` / `Oatmilk1769!`
- Cloudflare: `warehouse.techchefstx.work` → `http://192.168.0.24:3090`

## Run on your PC (same compose)

```powershell
cd wms
docker compose up -d --build
```

Open http://localhost:3090
