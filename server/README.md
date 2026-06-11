# sarah-rdv-api

Mini-backend Node qui remplace Supabase pour le projet sarah-rendez-vous.
Express + better-sqlite3 + multer, ES modules, aucun ORM.

## Install

```sh
npm ci
```

## Variables d'environnement

| Var                | Default              | Note                                                                                |
|--------------------|----------------------|-------------------------------------------------------------------------------------|
| `ACCESS_CODE`      | (obligatoire)        | Code partagé. Crash si absent.                                                      |
| `DATA_DIR`         | `/var/lib/sarah-rdv` | Contient `data.db` et `photos/`. La DB est créée au démarrage si absente.           |
| `PORT`             | `9092`               |                                                                                     |
| `HOST`             | `127.0.0.1`          |                                                                                     |
| `MEDIA_URL_PREFIX` | `/rdv/media`         | Préfixe public renvoyé dans les URLs photo (upload + nettoyage). Voir doc démo.     |

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

## Schéma de DB et migrations

La DB SQLite vit **sur le serveur**, pas dans le repo. Sur prod elle est
persistante (`/var/lib/sarah-rdv/data.db`) ; sur l'instance démo elle est
recréée à chaque restart par [`seed-demo.js`](./seed-demo.js).

**Le schéma est managé directement dans `index.js`** au démarrage du
process, en deux étapes idempotentes :

```js
// 1. Schéma de base — ne touche jamais aux colonnes existantes.
db.exec(`
  CREATE TABLE IF NOT EXISTS date_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    ...
  );
`);

// 2. Migrations additives — ajoute ce qui manque, ignore ce qui est déjà là.
addColumnIfMissing("ALTER TABLE date_events ADD COLUMN event_time TEXT DEFAULT ''");
addColumnIfMissing("ALTER TABLE date_events ADD COLUMN rating INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing("ALTER TABLE date_events ADD COLUMN accepted INTEGER NOT NULL DEFAULT 1");
```

Conséquence : **chaque restart de service applique automatiquement les
migrations**, sans étape `npm run migrate` à lancer à la main. Le webhook de
déploiement restart `sarah-rdv-api.service` (prod) et
`sarah-rdv-demo-api.service` (démo) à chaque push qui touche `server/`, donc
les deux instances finissent toujours avec le même schéma.

### Ajouter une colonne — checklist

1. **Ne modifie pas** le `CREATE TABLE` historique — c'est la baseline des DB
   créées avant la migration. Ajoute uniquement une nouvelle ligne :
   ```js
   addColumnIfMissing("ALTER TABLE date_events ADD COLUMN <nom> <type> DEFAULT <valeur>");
   ```
   Le `DEFAULT` est important : c'est ce que reçoivent les lignes existantes.
2. Si le code lit la nouvelle colonne (route GET, `rowToEvent`), ajoute-la
   à `WRITABLE_FIELDS` si elle doit être modifiable par l'API, et au mapping
   `rowToEvent` côté backend.
3. Si les events démo doivent avoir une valeur particulière sur cette colonne,
   ajoute le champ aux objets `events[]` de [`seed-demo.js`](./seed-demo.js)
   et au paramètre de l'`INSERT`. Sinon le `DEFAULT` suffit.
4. Push sur `main`. Le webhook fait le reste — prod garde ses données, démo
   est wipée + reseed.

### Ajouter une table

Même principe que pour une colonne : ajoute un bloc `CREATE TABLE IF NOT
EXISTS` dans le `db.exec(...)` initial de `index.js`, juste après le
`CREATE TABLE date_events`. Il sera créé au prochain restart si la table
n'existe pas, no-op sinon.

```js
db.exec(`
  CREATE TABLE IF NOT EXISTS date_events ( ... );

  -- Nouvelle table : commentaires liés à un event.
  CREATE TABLE IF NOT EXISTS date_comments (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES date_events(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_date_comments_event_id
    ON date_comments(event_id);
`);
```

Points à ne pas oublier :

- **`IF NOT EXISTS`** sur la table *et* sur chaque index. Sans ça, le 2ème
  restart crashe avec `table already exists`.
- **Foreign keys** : `index.js` active déjà `db.pragma('foreign_keys = ON')`
  au démarrage, donc le `REFERENCES ... ON DELETE CASCADE` fonctionne tel
  quel. Garde ça en tête si tu désactives le pragma quelque part.
- **Index** : à ajouter dans le même `db.exec(...)` que la table, pour qu'ils
  apparaissent en même temps sur les DB existantes (idempotent grâce au
  `IF NOT EXISTS`).
- **Triggers** : si tu ajoutes un trigger `updated_at` à la main (cf. celui
  existant sur `date_events`), pareil : `CREATE TRIGGER IF NOT EXISTS`.
- **Routes API** : la table seule ne sert à rien sans les `app.get/post/...`
  qui la lisent et l'écrivent. Pense aussi à ajouter les champs sensibles
  à un éventuel `WRITABLE_FIELDS` équivalent.
- **Seed démo** : si la table doit contenir du dummy content en démo, étends
  `seed-demo.js` — ajoute le `CREATE TABLE IF NOT EXISTS` *aussi* dedans (il
  wipe la DB avant `index.js` ne tourne, donc il a besoin de connaître les
  tables qu'il veut populater) et ajoute les `INSERT`.

### Renommer / supprimer une table

À éviter tant que possible — c'est destructif et SQLite ne gère pas ça
proprement entre deux services qui écrivent. Si vraiment nécessaire :

1. Backup `data.db` manuellement avant le push (voir plus bas).
2. Code la migration comme une suite explicite : `CREATE TABLE new`,
   `INSERT INTO new SELECT ... FROM old`, `DROP TABLE old`, `ALTER TABLE new
   RENAME TO old`. Mets-la dans une fonction `runOnce()` gardée par une
   table `_migrations(id TEXT PRIMARY KEY)` que tu coches après exécution,
   sinon elle re-tourne à chaque restart.
3. Sur démo, comme la DB est wipée à chaque restart, pas besoin de migration —
   il suffit que `seed-demo.js` connaisse la nouvelle structure.

### Limites

- Pas de rollback automatique. SQLite n'a pas de "down migration" propre.
  Si tu pushes une migration cassée, restaure le `.db` depuis un backup
  et reverte le commit.
- Pas de `DROP COLUMN` jusqu'à SQLite 3.35. Sur les vieilles versions, c'est
  `CREATE TABLE ... AS SELECT` + rename — pénible. Préfère laisser la colonne
  morte tant qu'elle ne gêne pas.
- Pas de backup automatique avant restart. Avant toute migration risquée :
  ```sh
  sudo cp /var/lib/sarah-rdv/data.db \
          /var/lib/sarah-rdv/data.db.bak-$(date +%Y%m%d-%H%M%S)
  ```

## Instance démo

Une seconde instance tourne le **même code** sous `/rdv-demo/`, avec une DB
séparée wipée à chaque restart pour des tests sans login. Voir
[`DEMO-DEPLOY.md`](./DEMO-DEPLOY.md) pour l'install et la conf Caddy.
