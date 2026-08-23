# Rebuild WMS on UGREEN (fresh start)

## 1. Stop and remove old project

UGREEN **Docker** → **Project** → select your WMS project → **Stop** → **Delete** (or remove containers).

## 2. Create new project

1. **Docker** → **Project** → **Create**
2. Name: `wms`
3. Paste **all** of `docker-compose.nas.yml` into the compose editor
4. **Deploy**

You should see **Pulling** for `ghcr.io/ilyjeff/warehouse-wms` (not **Building**).

## 3. Check it works

- LAN: http://192.168.0.24:3090
- Login: `dispatch@techchefstx.com` / `Oatmilk1769!`

## 4. Cloudflare

Tunnel hostname: `warehouse.techchefstx.work` → `http://192.168.0.24:3090`

---

## If pull says "denied"

GitHub package must be public:

https://github.com/users/ILYJEFF/packages/container/warehouse-wms/settings

→ **Change visibility** → **Public** → Deploy again.

Image build status (should be green):

https://github.com/ILYJEFF/Warehouse-WMS/actions

---

## Run locally on your PC while NAS deploys

```powershell
cd "C:\Users\Jeffrey Hammitt\Desktop\Techchefs CRM\wms"
docker compose up -d db
npm run dev
```

Open http://localhost:3090
