# Instructions pour Claude — Sarah Rendez-vous

App « espace couple » : front statique (HTML/JS vanilla + Leaflet) + API Node 22 Express + better-sqlite3 (`server/`), hébergée sur `https://lab.bourdat.fr/rdv/`.

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
