# Deploying the public demo instance (`/rdv-demo/`)

The demo runs the **same Node code** as the production API and serves the
**same static frontend** — only the runtime configuration differs (separate
DB, separate port, no `forward_auth` in front).

The frontend detects which instance it's running under by reading
`location.pathname` at boot (`window.__rdvConfig` in `index.html`). When
the path is under `/rdv-demo/`, it auto-fills a public demo access code
in `localStorage` so the lock screen self-bypasses.

## What runs where

| Concern         | Production                          | Demo                                    |
|-----------------|-------------------------------------|-----------------------------------------|
| URL             | `https://lab.bourdat.fr/rdv/`       | `https://lab.bourdat.fr/rdv-demo/`      |
| Static files    | `/var/www/sarah-rdv/`               | `/var/www/sarah-rdv/` (same)            |
| Node code       | `/opt/sarah-rdv-api/index.js`       | `/opt/sarah-rdv-api/index.js` (same)    |
| systemd unit    | `sarah-rdv-api.service`             | `sarah-rdv-demo-api.service`            |
| Env file        | `/etc/sarah-rdv-api.env`            | `/etc/sarah-rdv-demo-api.env`           |
| Backend port    | `9092`                              | `9093`                                  |
| Data dir        | `/var/lib/sarah-rdv/`               | `/var/lib/sarah-rdv-demo/`              |
| Auth (Caddy)    | `forward_auth` realm `rdv` (cookie) | none — public                           |
| Auth (app)      | user-entered code                   | hard-coded `demo-public`, auto-filled   |
| DB lifecycle    | persistent                          | wiped + reseeded on every service start |

## One-time install on the server

```sh
# 1. Make sure the latest sarah-rdv-api code is deployed on the server.
#    The webhook (sarah-rdv-webhook.service on :9091) handles this on push to main.

# 2. Data dir
sudo mkdir -p /var/lib/sarah-rdv-demo/photos
sudo chown -R atlas:atlas /var/lib/sarah-rdv-demo

# 3. Env + unit
sudo install -m 600 -o root -g root \
    /opt/sarah-rdv-api/server/systemd/sarah-rdv-demo-api.env.example \
    /etc/sarah-rdv-demo-api.env
sudo install -m 644 -o root -g root \
    /opt/sarah-rdv-api/server/systemd/sarah-rdv-demo-api.service.example \
    /etc/systemd/system/sarah-rdv-demo-api.service

# 4. Caddy block — append to /etc/caddy/conf.d/atlas.bourdat.fr.caddy
#    (see snippet below), then:
sudo caddy validate --config /etc/Caddyfile
sudo systemctl reload caddy

# 5. Start the demo backend (ExecStartPre runs seed-demo.js)
sudo systemctl daemon-reload
sudo systemctl enable --now sarah-rdv-demo-api.service
sudo journalctl -u sarah-rdv-demo-api.service -n 30 --no-pager

# 6. Smoke-test
curl -s http://127.0.0.1:9093/api/health
curl -sI https://lab.bourdat.fr/rdv-demo/   # should be 200, no 302 to /login
```

## Caddy snippet

Add the three blocks below **before** the existing `handle /rdv/*` block
(ordering is not strictly required since `/rdv-demo/...` does not match
`/rdv/*`, but keeping them together is easier to read).

```caddy
# ─── /rdv-demo/api/* : demo backend (port 9093), NO forward_auth ───
handle /rdv-demo/api/* {
    uri strip_prefix /rdv-demo
    reverse_proxy 127.0.0.1:9093 {
        header_up X-Forwarded-Prefix /rdv-demo
    }
}

# ─── /rdv-demo/media/* : demo photos, NO forward_auth ───
handle /rdv-demo/media/* {
    uri strip_prefix /rdv-demo/media
    root * /var/lib/sarah-rdv-demo/photos
    header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet"
    header Cache-Control "public, max-age=86400"
    file_server
}

# ─── /rdv-demo : same static frontend as /rdv, NO forward_auth ───
@rdvDemoNoSlash path /rdv-demo
redir @rdvDemoNoSlash /rdv-demo/ 308

handle /rdv-demo/* {
    uri strip_prefix /rdv-demo
    root * /var/www/sarah-rdv
    header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet"
    try_files {path} {path}/ /index.html
    file_server
}
```

## Resetting the demo DB manually

The DB resets on every restart of the unit. To force a clean state without
waiting for a natural restart:

```sh
sudo systemctl restart sarah-rdv-demo-api.service
```

To run the seed script standalone (e.g. when debugging dummy data):

```sh
sudo -u atlas \
  DEMO_SEED=1 DATA_DIR=/var/lib/sarah-rdv-demo \
  /usr/bin/node /opt/sarah-rdv-api/seed-demo.js
```

`seed-demo.js` refuses to run unless both `DEMO_SEED=1` and a `DATA_DIR`
containing the literal substring `sarah-rdv-demo` are set, so it cannot
accidentally wipe `/var/lib/sarah-rdv/`.

## Verifying the prod instance is unaffected

The shared code is backward-compatible:

- `MEDIA_URL_PREFIX` defaults to `/rdv/media` → prod URLs unchanged.
- `window.__rdvConfig.apiBase` derives from `location.pathname`; under
  `/rdv/` it resolves to `/rdv/api` → prod behaviour unchanged.

After deploying:

```sh
curl -sI https://lab.bourdat.fr/rdv/   # should still redirect to /login?realm=rdv
```
