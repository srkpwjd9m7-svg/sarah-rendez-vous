# Roadmap

## Etat actuel (2026-06-12)

- Front statique HTML/JS servi sur `https://lab.bourdat.fr/rdv/` + demo publique sur `https://atlas.bourdat.fr/rdv-demo/`
- Backend Node + Express + SQLite (better-sqlite3) sur le serveur, exposé via Caddy sous `/rdv/api/*`
- Upload photos vers `/var/www/sarah-rdv/data/photos/`, servies sous `/rdv/media/*`
- Auth : code secret unique cote serveur, transmis par le front en header `X-Access-Code`
- Auto-deploy : push sur `main` -> webhook GitHub -> `git reset --hard` cote serveur (+ filet cron 5 min)
- Notif Telegram a chaque deploy reussi/echec
- Flux d'invitations a deux temps (`pending` -> `matched` -> `confirmed`) avec deck swipe et `approval_count` 0..2

## Direction produit

Le projet vise a devenir une app mobile (iOS + Android) en **React Native** plus tard. Le site web actuel n'est qu'une premiere surface ; il doit rester un client comme un autre devant l'API.

### Regles de design qui en decoulent

1. **API REST standard, JSON only.** Pas de WebSocket, pas de SSE, pas de format custom. Tout doit pouvoir etre consomme depuis un `fetch()` RN sans adaptation.
2. **Pas de logique metier dans le front.** Le front ne calcule pas de droit d'acces, pas de validation critique. Tout passe par le backend ; le front devient une coquille remplacable.
3. **Pas de dependance navigateur dans l'API.** Pas de cookies, pas de session serveur, pas de CSRF magique. Auth = header `X-Access-Code` (et plus tard JWT/OAuth quand multi-utilisateur).
4. **Pas de framework lourd.** Express + better-sqlite3 + multer = la totalite. Pas de Nest, pas de Prisma, pas d'ORM. Plus l'API est petite, plus elle est facile a porter, debugger, deployer.
5. **Pas de custom UI library cote front.** Si quelque chose n'a pas d'equivalent direct en RN, on ne l'introduit pas (ex. : eviter Leaflet bricole, prevoir Mapbox/Maps natifs des le debut quand on cassera le monolithe).
6. **Schemas stables, versionnes.** Toute modif breaking de l'API -> bump `v1` vers `v2` dans l'URL, pas de mutation silencieuse. Cette regle est gratuite tant qu'on est seul utilisateur, payante ensuite si on l'oublie.

## Prochaines etapes

### Court terme (semaines)

- [ ] **Migration depuis Supabase** terminee (table `date_events` + photos).
- [ ] **Backup quotidien** du SQLite vers Drive ou B2 (pattern timeline-lettres).
- [ ] **Endpoint /api/health** monitoré par Prometheus.

### Moyen terme (apres mise en service stable)

- [ ] **Multi-utilisateurs** : remplacer le code secret unique par comptes + JWT.
- [ ] **App React Native** : nouveau repo `sarah-rdv-mobile`, point l'API existante. Reutiliser la doc du schema (ne pas redocumenter).
- [ ] **Sync offline** RN : strategie a definir (probablement lecture cache + queue de mutations).
- [ ] **Notifications push** (Expo Notifications) pour rappels J-1 des rendez-vous.

### Long terme

- [ ] **Hosting dedie** si trafic croît : extraire l'API du serveur OpenClaw vers un service plus contraint (container ou VM dediee).
- [ ] **Audit RGPD** des photos (consentements, suppression effective).

## Decisions actees

| Date | Decision | Raison |
|------|----------|--------|
| 2026-06-11 | Quitter Supabase | Vendor lock-in + RLS surface complexe pour un usage perso |
| 2026-06-11 | Node + Express + better-sqlite3 | Plus simple a porter ; pas d'ORM ; meme runtime que le futur RN partiellement |
| 2026-06-11 | Photos sur disque local + Caddy | Pas de S3 inutile a cette echelle ; backup classique |
| 2026-06-11 | Code secret en header | Etape transition ; on remplacera par auth user des qu'on ajoute >1 personne |
| 2026-06-12 | Invitations a deux temps (`approval_count` 0..2 + statut `matched`) | Permet de creer une invitation sans date et de la valider a deux avant de fixer le RDV. Etape vers le futur mode multi-utilisateurs. Piege a retenir : la file d'invitations (`pendingQueue`) contient `pending` ET `matched` — tout filtre cote front doit inclure les deux statuts. |
