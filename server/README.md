# sarah-rdv-api

Mini-backend Node qui remplace Supabase pour le projet sarah-rendez-vous.
Express + better-sqlite3 + multer, ES modules, aucun ORM.

## Install

```sh
npm ci
```

## Variables d'environnement

| Var           | Default              | Note                           |
|---------------|----------------------|--------------------------------|
| `ACCESS_CODE` | (obligatoire)        | Code partagé. Crash si absent. |
| `DATA_DIR`    | `/var/lib/sarah-rdv` | Contient `data.db` et `photos/`|
| `PORT`        | `9092`               |                                |
| `HOST`        | `127.0.0.1`          |                                |

## Lancer

```sh
ACCESS_CODE=secret DATA_DIR=./var node index.js
```

En prod : systemd avec `EnvironmentFile=/etc/sarah-rdv.env`.

## Tester

```sh
curl http://127.0.0.1:9092/api/health
curl -X POST -H 'content-type: application/json' \
  -d '{"code":"secret"}' http://127.0.0.1:9092/api/auth/check
curl -H 'X-Access-Code: secret' http://127.0.0.1:9092/api/events
```

## Migration depuis dump Supabase

```sh
DATA_DIR=./var node migrate.js /tmp/sarah-rdv-migration/dump.json
```

Idempotent (skip si l'id existe). Télécharge les photos référencées par URL et
les remplace par `/rdv/media/<uuid>.<ext>` si elles existent.
