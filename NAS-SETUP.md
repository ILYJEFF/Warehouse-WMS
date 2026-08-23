# Put WMS on your NAS (simple version)

## UGREEN Docker **Project** (what you are using)

You are not missing something obvious. The Docker Project UI does **not** read the `.env` on your PC.

In a **Project**, you either:
- put a `.env` file in the project folder on the NAS, **or**
- type the variables into the Project **Environment** / **Env** screen

That is why you saw `POSTGRES_PASSWORD is missing`.

### Step 1: Project folder on the NAS

The project path must be the **whole** GitHub repo (not just the yaml), because the app has to **build** from source.

Example path: `/volume1/docker/Warehouse-WMS`

Clone once (File Manager SSH, or git on NAS):

```bash
git clone https://github.com/ILYJEFF/Warehouse-WMS.git /volume1/docker/Warehouse-WMS
```

### Step 2: Create / edit the Docker Project

1. Open **Docker** → **Project** → **Create** (or edit your existing project)
2. **Path:** `/volume1/docker/Warehouse-WMS` (folder that contains `docker-compose.yml` + `Dockerfile`)
3. **Compose file:** `docker-compose.yml` (the one in that repo, not Line CRM)

### Step 3: Add environment variables (required)

In the Project **Environment variables** section, add **every** line below (name = value):

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

**Alternative:** create a file named `.env` in `/volume1/docker/Warehouse-WMS/` with those same lines (copy from `env.nas.example`). Some UGREEN versions pick that up automatically.

### Step 4: Deploy

Click **Deploy** / **Build and start**. First run can take several minutes (`wms-app` is building).

When healthy you should see two containers:
- `wms-postgres`
- `wms-app`

LAN test: **http://192.168.0.24:3090**

Login: `dispatch@techchefstx.com` / `Oatmilk1769!`

### Step 5: Cloudflare (separate from Docker Project)

Your tunnel is **not** part of this compose file.

Cloudflare Zero Trust → Tunnels → your tunnel → Public hostname:

- `warehouse.techchefstx.work` → `http://192.168.0.24:3090`

---

## PC vs NAS (still the confusing part)

| | Your PC | NAS Docker Project |
|---|---|---|
| **Purpose** | Coding (`npm run dev`) | Live site |
| **Config** | `wms/.env` on PC | Env vars **in the Project UI** (or `.env` on NAS) |
| **Needs POSTGRES_PASSWORD?** | No | **Yes** |

---

## SSH version (if you prefer terminal)


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
