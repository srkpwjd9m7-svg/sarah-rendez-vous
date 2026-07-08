# Instructions pour Claude — Sarah Rendez-vous

App « espace couple » : front statique (HTML/JS vanilla + Leaflet) + API Node 22 Express + better-sqlite3 (`server/`), hébergée sur `https://lab.bourdat.fr/rdv/`.

## 🎫 Tes tickets — backlog commun flaggé `#sarah-rdv`

Ce projet **n'a pas son backlog à lui** : ses tickets vivent dans le **backlog serveur, fichier par projet** — **`/root/.openclaw/server-context/backlog.d/sarah-rdv.md`** (source de vérité unique, rendu live sur `asimov.bourdat.fr`, pages **Backlog** + **Roadmap**). Loïc — ou Asimov, son PO — y dépose des tâches **flaggées `#sarah-rdv`** (ex. « sur sarah-rdv, ajoute un rappel J-1 » → `[P2][todo] #sarah-rdv Rappel J-1 — … ~3h`).

> ⚠️ **Ne lis/écris JAMAIS l'ancien monolithe `backlog.md`** : depuis 2026-07-03 chaque projet a son fichier `backlog.d/<flag>.md` (le hub rend ces fichiers-là). Grep le monolithe = tu ne verras rien.

**Au début d'une session** (le hook `SessionStart` `tools/sarah-rdv-backlog-load.sh` le fait automatiquement), récupère TES tickets ouverts et propose-les à Loïc :

```bash
ssh root@atlas.bourdat.fr \
  "grep -nE '^\[(P[0-4]|quickwin|wishlist)\]\[(todo|progress)\]' /root/.openclaw/server-context/backlog.d/sarah-rdv.md"
```

Pour chaque ticket traité :
1. **(option)** flip `[todo]` → `[progress]` : édition directe de `backlog.d/sarah-rdv.md`, **re-grep la ligne juste avant d'écrire** (état live, éviter le lost-update).
2. **Traite-le** ici (code + doc + branche-par-session).
3. **Marque-le `done`** dans `backlog.d/sarah-rdv.md`, une fois fini **et prouvé** (matching sur un bout unique du titre) :
   ```bash
   ssh root@atlas.bourdat.fr \
     "sed -i 's/^\[\(P[0-4]\|quickwin\|wishlist\)\]\[\(todo\|progress\)\] #sarah-rdv Titre court/[P2][done] #sarah-rdv Titre court/' \
      /root/.openclaw/server-context/backlog.d/sarah-rdv.md"
   ```
4. **Signifie-le à Loïc** : « ✅ ticket *Titre court* traité (commit `…`), passé en `done` ». Il le verra aussi sur le hub.

**AJOUTER un ticket** → jamais d'édition brute (le flock protège contre le lost-update) : utilise **`oc-backlog add`**, qui route automatiquement vers `backlog.d/sarah-rdv.md` grâce au 1er `#flag` :
```bash
ssh root@atlas.bourdat.fr "oc-backlog add '[P2][todo] #sarah-rdv Titre court — pourquoi @openclaw:doc.md ~Nh'"
```
Token optionnel `@id:SR-N` (ID humain stable, référençable sur le hub) — attribué par le PO.

Ne touche **que** tes lignes `#sarah-rdv` ; ne ferme jamais un ticket non prouvé.

> **Note d'accès repo** : `atlaspowerful-maker` n'a pas les droits `push` sur `srkpwjd9m7-svg/sarah-rendez-vous` (repo pull-only pour ce compte). Le flux établi (PR#3, 2026-06-20) passe par le fork `atlaspowerful-maker/sarah-rendez-vous` : push sur le fork, PR vers `srkpwjd9m7-svg/sarah-rendez-vous:main`, merge par Loïc (ou compte avec write).

## Références infra (chemins locaux du Mac de Loïc)

- **Doc serveur** : `~/Desktop/Openclaw/` — fiche complète dans `08_PROJECTS.md`, conventions dans `13_NOUVEAU_PROJET.md`.
- **IaC** : `~/Desktop/atlas-infra` (repo privé) — rôle Ansible `sarah-rdv`. **Le serveur n'est jamais modifié à la main** : toute modif serveur passe par le rôle Ansible + la doc, dans la même tâche.

## Déploiement — attention, `main` = prod

Tout push sur `main` déclenche un déploiement automatique (webhook GitHub, filet cron 5 min) :
- le front est resynchronisé tel quel ;
- si `server/` a changé : rsync vers l'API + `npm ci` + restart du service.

Ne jamais committer de données (DB, photos, `.env`) : elles vivent hors repo, sur le serveur.

## Contraintes produit

Devra alimenter une app React Native (iOS/Android) à terme : **API REST/JSON only, pas de cookie côté API, pas de WebSocket** (règles de design dans ROADMAP.md).

## Règle de doc vivante

Toute session qui apprend quelque chose de notable (piège, décision, surprise) ou change un comportement met à jour la doc du repo (README.md / ROADMAP.md) **dans la même session**.

## Règle git — branche par session

Plusieurs sessions Claude travaillent souvent en parallèle sur ce repo. Jamais de commit direct sur `main` :
1. Début de session : `git fetch && git pull` sur `main`, puis branche `session/YYYY-MM-DD-<sujet>`.
2. Commits uniquement sur cette branche.
3. Fin de session : rebase sur `main`, merge, push, supprimer la branche. **Le merge dans `main` part en prod immédiatement.**
4. Conflit = travail d'une autre session : intégrer, ne jamais écraser.
