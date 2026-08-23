# Put WMS on your NAS (simple version)

You have **two different machines** and **two different `.env` files**. That is what has been confusing.

| Where | What it runs | Which `.env` |
|---|---|---|
| **Your PC** | `npm run dev` while coding | `wms/.env` (you already have this) |
| **NAS** | Docker (database + website) | `wms/.env` **on the NAS** (copy from `env.nas.example`) |

Do not use your PC `.env` on the NAS. Docker on the NAS needs `POSTGRES_PASSWORD`, which your PC file does not have.

---

## Step 1: Get the code on the NAS

Clone or copy the repo folder to the NAS, e.g. `/volume1/docker/wms/`

From GitHub:

```bash
git clone https://github.com/ILYJEFF/Warehouse-WMS.git /volume1/docker/wms
```

---

## Step 2: Create `.env` on the NAS

In that folder on the NAS:

```bash
cp env.nas.example .env
```

That is it. The example already has passwords filled in. Change them later if you want.

---

## Step 3: Start it

Still in that folder on the NAS:

```bash
docker compose up -d --build
```

Wait a few minutes the first time (builds the app).

Check:

```bash
docker ps
```

You should see `wms-postgres` and `wms-app` running.

Open on your LAN: **http://192.168.0.24:3090**

Login: `dispatch@techchefstx.com` / `Oatmilk1769!`

---

## Step 4: Cloudflare (one line change)

You already have a Cloudflare tunnel on the NAS. You are **not** installing a new one.

In **Cloudflare Zero Trust** → **Networks** → **Tunnels** → your tunnel → **Public Hostname**:

- Hostname: `warehouse.techchefstx.work`
- Service: **`http://192.168.0.24:3090`**

Delete any old routes that pointed at ports 8080 or 8090 (OpenBoxes / Sentry are gone).

Then open: **https://warehouse.techchefstx.work**

---

## That is the whole thing

```
NAS folder
  docker-compose.yml   ← starts database + app
  .env                 ← copy from env.nas.example
  (rest of repo)

Cloudflare tunnel  →  192.168.0.24:3090  →  WMS app
```

Postgres port **5435** is only for your LAN. Never put it in Cloudflare.

---

## If something fails

**"POSTGRES_PASSWORD is missing"**  
You did not create `.env` on the NAS, or you are in the wrong folder. Run `cp env.nas.example .env` in the same folder as `docker-compose.yml`.

**"TUNNEL_TOKEN is missing"**  
You have an old `docker-compose.yml`. Pull latest from GitHub. The new one does not use a tunnel container.

**Wrong compose file**  
Use the one inside **Warehouse-WMS** / **wms**. Not `Techchefs CRM/docker-compose.yml` at the repo root (that is Line CRM, different app).
