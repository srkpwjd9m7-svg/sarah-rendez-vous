# Sarah Rendez-vous

Site romantique en une page pour organiser des rendez-vous, choisir un lieu sur une carte, garder des souvenirs et classer les activites terminees.

Le site principal garde sa palette rose. Seule la demo publique utilise maintenant une palette mauve chargee a part.

## Objectif

Le projet a ete cree comme un espace prive pour un couple afin de :

- creer un rendez-vous avec une date, un lieu et un message
- choisir le lieu directement sur une carte interactive
- verrouiller l'acces au site avec un code secret
- retrouver les rendez-vous a venir
- valider un rendez-vous une fois termine
- ajouter des photos souvenir apres l'activite
- ranger automatiquement les rendez-vous termines dans une categorie separee

## Etat actuel du projet

Le site est actuellement une application front simple, sans backend, base de donnees ni compte utilisateur.

Les donnees sont enregistrees dans le navigateur avec `localStorage` et l'acces temporaire au site est memorise dans `sessionStorage`.

Le projet utilise maintenant une API REST interne (servie sous `/rdv/api/`) pour la sauvegarde distante des rendez-vous et des photos.

Si l'API est injoignable, le site bascule automatiquement en mode local :

- les rendez-vous sont conserves sur le navigateur utilise
- si on change d'appareil ou de navigateur, les donnees ne suivent pas
- le site est statique cote front et heberge via GitHub Pages

## Fonctionnalites

### 1. Protection par code

Le projet utilise maintenant un seul lien principal :

- `index.html`

Le site est entierement bloque par un ecran de mot de passe tant que le bon code n'a pas ete saisi.

- code actuel : `01052021`
- si le bon code est saisi, l'ecran de blocage disparait et le site devient accessible
- l'acces reste ouvert pour la session en cours
- le bouton `Se deconnecter` rebloque immediatement le site
- `login.html`, `app.html` et `rdv.html` redirigent vers `index.html`

### 2. Creation d'un rendez-vous

Chaque rendez-vous peut contenir :

- un titre
- une date
- un lieu
- un lien Google Maps
- un texte libre
- des photos

### 3. Selection du lieu sur carte

Le lieu peut etre choisi de deux manieres :

- en recherchant un endroit sur la carte
- en cliquant directement sur la carte

Quand on clique sur la carte :

- un marqueur est place
- les coordonnees sont recuperees
- une adresse lisible est recherchee
- la case `Lieu` est remplie automatiquement
- un lien Google Maps est genere

### 4. Gestion des rendez-vous

Le site separe les activites en deux groupes :

- `Rendez-vous a venir`
- `Rendez-vous termines`

Un rendez-vous cree arrive d'abord dans la liste des rendez-vous a venir.

### 4 bis. Invitations a deux temps (matching)

Une invitation peut aussi etre creee **sans date** : elle reste a l'etat `pending` tant que les deux personnes ne l'ont pas validee.

- chaque "oui" incremente `approval_count` (0 -> 1 -> 2, clampé cote serveur)
- a 2/2 oui, l'invitation passe en statut `matched` et le couple est invite a fixer la date
- le pile de cartes "Invitations en attente" (deck swipe) accepte les deux types : `pending` et `matched`
  - swipe droite sur un `pending` = "Dire oui"
  - swipe droite sur un `matched` = ouvre la feuille de planification (titre/lieu deja remplis, on choisit juste la date)
  - swipe gauche = "Passer pour l'instant" (l'invitation reste en file, repoussee a la fin)
- l'ordre de la pile est memorise dans `localStorage` sous `nos-rendez-vous-pending-order`

Schema des statuts cote front : `pending` | `matched` | `confirmed` | `toValidate` | `done`.

### 5. Validation de fin de rendez-vous

A la fin d'un rendez-vous, il est possible de :

- ajouter un mot de fin
- ajouter une ou plusieurs photos souvenir
- cliquer sur `Valider ce rendez-vous`

Une fois valide :

- le rendez-vous quitte la liste des elements a venir
- il apparait dans la categorie `Rendez-vous termines`
- les souvenirs restent consultables plus tard

### 6. Calendrier

Le site affiche un calendrier du mois avec :

- les jours du mois
- un indicateur sur les jours ou un rendez-vous existe

### 7. Synchronisation via API

Le projet contient maintenant une integration avec une API REST interne (sous `/rdv/api/`) pour :

- sauvegarder les rendez-vous en ligne
- sauvegarder les photos via l'endpoint `/rdv/api/photos`
- relire les rendez-vous depuis plusieurs appareils
- proteger l'API avec un header `X-Access-Code` (le code est demande a la connexion)

Si l'API est injoignable, le site repasse automatiquement en mode local.

## Structure du projet

```text
.
├── README.md
├── app.html
├── index.html
├── login.html
├── rdv.html
├── server/
└── assets/
    └── leaflet/
```

### Fichiers principaux

- `index.html`
  page principale unique du site avec verrouillage par mot de passe integre

- `rdv.html`
  redirection simple vers `index.html`

- `login.html`
  redirection simple vers `index.html`

- `app.html`
  redirection simple vers `index.html`

- `assets/leaflet/`
  copie locale de Leaflet pour eviter les erreurs de chargement externes

- `server/`
  backend API REST servi sous `/rdv/api/` (auth par code, CRUD events, upload photos)

## Choix techniques

### Frontend

Le projet repose sur :

- HTML
- CSS
- JavaScript vanilla

Il n'utilise pas :

- React
- Vue
- framework CSS
- backend

### Carte

Le projet utilise :

- [Leaflet](https://leafletjs.com/) pour la carte interactive
- [OpenStreetMap](https://www.openstreetmap.org/) pour les tuiles cartographiques
- [Nominatim](https://nominatim.org/) pour la recherche et le reverse geocoding

### Cartes externes

Google Maps n'est pas utilise comme carte cliquable integree.

Aujourd'hui :

- la selection du lieu se fait sur la carte Leaflet / OpenStreetMap
- un lien Google Maps est enregistre pour ouvrir le lieu ensuite

Ce choix permet d'avoir une vraie selection de point sans cle API Google Maps.

### Sauvegarde distante

Le projet utilise une API REST interne (sous `/rdv/api/`) :

- `GET /api/events`, `POST /api/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id`
- `POST /api/photos` (multipart `file`) renvoie une URL relative `/rdv/media/<uuid>.<ext>`
- protection par header `X-Access-Code` (verifie via `POST /api/auth/check`)

## Donnees enregistrees

Chaque rendez-vous enregistre contient actuellement une structure proche de :

```js
{
  id,
  title,
  date,           // optionnelle si statut=pending (l'invitation peut etre creee sans date)
  time,
  location,
  coordinates,
  mapLink,
  note,
  photos,
  status,         // 'pending' | 'matched' | 'confirmed' | 'toValidate' | 'done'
  approvalCount,  // 0..2 (nombre de "oui" sur une invitation)
  rating,
  completed,
  completionNote,
  completionPhotos
}
```

Cote backend, le champ correspond a la colonne `approval_count` de la table `date_events` (`INTEGER NOT NULL DEFAULT 0`, clampe 0..2 a l'ecriture). Le serveur autorise un `POST /api/events` sans `event_date` uniquement si `accepted=false` (invitation `pending`).

Quand l'API est joignable, ces donnees sont stockees cote serveur (table `date_events`).

## Fonctionnement local

Pour ouvrir le projet en local :

1. ouvrir `index.html`
2. entrer le code d'acces
3. acceder au site apres debloquage
4. ajouter ou consulter les rendez-vous

Le projet ne demande pas de build ni d'installation npm.

## Mise en ligne

Le projet est publie sur GitHub Pages.

- depot GitHub :
  [srkpwjd9m7-svg/sarah-rendez-vous](https://github.com/srkpwjd9m7-svg/sarah-rendez-vous)

- site en ligne :
  [https://srkpwjd9m7-svg.github.io/sarah-rendez-vous/](https://srkpwjd9m7-svg.github.io/sarah-rendez-vous/)

## Backend API

L'API REST est servie sous `/rdv/api/` :

- `POST /api/auth/check` body `{code}` → 200 ou 401
- `GET /api/events` → liste triee par date croissante
- `POST /api/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id`
- `POST /api/photos` multipart `file` → `{url:"/rdv/media/<uuid>.<ext>"}`
- `DELETE /api/photos/:filename`
- header `X-Access-Code` requis sauf sur `/api/health` et `/api/auth/check`

Le code d'acces est stocke cote navigateur dans `localStorage` (cle `nos-rendez-vous-access-code`) apres une connexion reussie.

## Limites actuelles

- pas de synchronisation entre plusieurs appareils
- pas de compte utilisateur
- pas de base de donnees distante
- pas de modification ou suppression d'un rendez-vous termine
- le code d'acces est visible dans le code source
- les donnees peuvent etre perdues si le stockage local du navigateur est vide

Ces limites changent partiellement quand l'API est joignable :

- la synchro multi-appareils devient possible
- les photos peuvent etre conservees en ligne

Mais il reste une limite importante :

- l'authentification est un simple code partage, la securite reste basique

## Pistes d'evolution

Ameliorations naturelles pour la suite :

- edition d'un rendez-vous
- suppression d'un rendez-vous
- filtre par date ou par lieu
- galerie souvenir plus riche
- sauvegarde distante
- partage multi-appareils
- vrai systeme d'authentification
- export des souvenirs

## Notes de maintenance

Le projet est volontairement simple et facile a modifier.

Historique Git :

- l'historique des commits a ete realigne pour utiliser l'identite GitHub `srkpwjd9m7-svg`

Les parties les plus importantes a surveiller sont :

- la logique de stockage local
- la logique de bascule local / API
- la logique de verrouillage sur `index.html`
- la logique de separation `a venir / termines`
- la logique de carte et de reverse geocoding
- la protection par code
- la pile d'invitations (`pendingQueue` / `mountPendingDeck` dans `assets/app.js`) : la file contient les statuts `pending` ET `matched`, tous les filtres qui consomment la file doivent inclure les deux.

## Regle de travail demandee

Souhait utilisateur pour la suite :

- pousser les modifications sur GitHub automatiquement apres les changements, sans redemander confirmation
