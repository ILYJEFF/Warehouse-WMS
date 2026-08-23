# Cloudflare Tunnel for Techchefs WMS

Public URL: **https://warehouse.techchefstx.work**

## If cloudflared runs in `docker-compose.yml` (recommended)

1. Open **Cloudflare Zero Trust** → **Networks** → **Tunnels**.
2. Create a tunnel (or reuse your existing one after removing old routes).
3. On **Public Hostname**, add:
   - **Subdomain:** `warehouse`
   - **Domain:** `techchefstx.work`
   - **Service type:** HTTP
   - **URL:** `http://app:3090`
4. Copy the **tunnel token** into `.env` as `TUNNEL_TOKEN`.
5. Remove old hostname routes that pointed at OpenBoxes/Sentry (ports 8080, 8090).
6. From the WMS folder on the NAS:

```bash
cp .env.docker.example .env
# edit passwords + TUNNEL_TOKEN
docker compose up -d --build
```

## If cloudflared already runs on the NAS (outside Docker)

Skip the `tunnel` service or comment it out, then point your existing tunnel at:

```text
http://127.0.0.1:3090
```

or

```text
http://192.168.0.24:3090
```

Keep `APP_URL=https://warehouse.techchefstx.work` in `.env`.

## Security

- Only expose the **WMS app** (port 3090) through the tunnel.
- Keep Postgres on **5435** LAN-only. Do not add it to the tunnel.
- Login is required (`dispatch@techchefstx.com` + your admin password).

## Verify

```bash
curl -s https://warehouse.techchefstx.work/api/health
# {"ok":true,"service":"techchefs-wms"}
```
