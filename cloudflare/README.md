# Cloudflare Tunnel for Techchefs WMS

Public URL: **https://warehouse.techchefstx.work**

## Option A: cloudflared already on the NAS (most common)

1. **Do not** use the tunnel profile. Just run:

```bash
docker compose up -d --build
```

2. In **Cloudflare Zero Trust** → **Tunnels** → your tunnel → **Public Hostname**:
   - `warehouse.techchefstx.work` → `http://192.168.0.24:3090`

No `TUNNEL_TOKEN` needed in `.env`.

## Option B: run cloudflared inside this compose stack

1. Add `TUNNEL_TOKEN` to `.env` (from Cloudflare tunnel install command).
2. Set public hostname service URL to `http://app:3090`.
3. Start with the tunnel profile:

```bash
docker compose --profile tunnel up -d --build
```

## Security

- Only expose the **WMS app** (port 3090) through the tunnel.
- Keep Postgres on **5435** LAN-only. Do not add it to the tunnel.
- Login is required (`dispatch@techchefstx.com` + your admin password).

## Verify

```bash
curl -s https://warehouse.techchefstx.work/api/health
# {"ok":true,"service":"techchefs-wms"}
```
