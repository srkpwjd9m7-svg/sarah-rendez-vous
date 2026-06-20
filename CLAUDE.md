# Instructions pour Claude — Sarah Rendez-vous

App « espace couple » : front statique (HTML/JS vanilla + Leaflet) + API Node 22 Express + better-sqlite3 (`server/`), hébergée sur `https://lab.bourdat.fr/rdv/`.

## 🎫 Tes tickets — backlog commun flaggé `#sarah-rdv`

Ce projet **n'a pas son backlog à lui** : ses tickets vivent dans le **backlog commun du serveur** (`/root/.openclaw/server-context/backlog.d/sarah-rdv.md`, source de vérité unique, rendue live sur `asimov.bourdat.fr`). Loïc — ou Asimov, son PO — y dépose des tâches **flaggées `#sarah-rdv`**.

**Au début d'une session de travail sur ce projet**, récupère TES tickets et propose-les à Loïc :

```bash
ssh root@atlas.bourdat.fr \
  "grep -nE '^\[(P[0-9]|quickwin|wishlist)\]\[(todo|progress)\]' /root/.openclaw/server-context/backlog.d/sarah-rdv.md"
```

Pour chaque ticket que vous décidez de traiter :
1. **(option)** passe-le en cours côté serveur : `[todo]` → `[progress]` sur la ligne (matching sur un bout unique du titre, édition flock+atomic rename).
2. **Traite-le** dans ce repo (code + doc, **branche par session**, revue avant merge).
3. **Marque-le `[done]`** sur le serveur (la source de vérité, pas seulement en local) une fois **fini et prouvé**. Le générateur `atlas-backlog-gen` se relance automatiquement (path-unit sur `backlog.d/`) → le hub voit le `done` en quelques secondes.
4. **Signale-le à Loïc** : « ✅ ticket *…* traité (commit `…`), passé en `done` ». Il le verra aussi sur le hub.

**Ajouter un ticket** pour ce projet ? Utilise l'outil déterministe `oc-backlog` côté serveur (B-33, 2026-06-20) qui pose un flock exclusif + append atomique + route automatiquement vers `backlog.d/sarah-rdv.md` selon le `#flag` :

```bash
ssh root@atlas.bourdat.fr \
  "/usr/local/sbin/oc-backlog add '[P2][todo] #sarah-rdv Titre — pourquoi ~Nh'"
```

Règles : ne touche **que** tes lignes `#sarah-rdv` ; ne ferme jamais un ticket non prouvé ; nouvelle tâche durable pour ce projet → ajoute-la via `oc-backlog add` (convention `[PRIO][todo] #sarah-rdv Titre — pourquoi ~Nh`, jamais d'édition LLM brute du fichier serveur).

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
