# UGREEN — read this once

## Why you keep seeing `Dockerfile: no such file`

The compose yaml is only **instructions**. Docker still needs the **app files** on the NAS:

- Dockerfile
- package.json
- src/
- prisma/
- etc.

Pasting yaml into the Project editor **does not** copy those files.

---

## Do this (copy folder, then deploy)

### 1. Copy `wms` folder to the NAS

On your PC, copy this entire folder:

```
C:\Users\Jeffrey Hammitt\Desktop\Techchefs CRM\wms
```

To the NAS (File Manager or network share), e.g.:

```
shared/docker/wms
```

Or run on your PC:

```powershell
cd "C:\Users\Jeffrey Hammitt\Desktop\Techchefs CRM\wms"
.\copy-to-nas.ps1
```

Do **not** copy `node_modules` or `.next` (the script skips them).

### 2. Confirm Dockerfile is on the NAS

In **Files** on the NAS, open `docker/wms`. You must see **Dockerfile** in that folder.

### 3. Docker Project

1. **Docker** → **Project** → Create or edit
2. **Project path:** the `wms` folder you just copied (not an empty folder)
3. **Compose:** paste **`docker-compose.ugreen.build.yml`**
4. **Deploy** (first time builds ~5 minutes)

---

## Alternative: pull image (no copy)

Only if you made the GitHub package **public**:

1. https://github.com/users/ILYJEFF/packages → **warehouse-wms** → **Public**
2. Use **`docker-compose.ugreen.yml`** (has `ghcr.io/...`, no `build:`)

---

## Cloudflare

`warehouse.techchefstx.work` → `http://192.168.0.24:3090`

Login: `dispatch@techchefstx.com` / `Oatmilk1769!`
