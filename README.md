# Sarah Rendez-vous

Site romantique en une page pour organiser des rendez-vous, choisir un lieu sur une carte, garder des souvenirs et classer les activites terminees.

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

Le projet est maintenant prepare pour une sauvegarde distante avec Supabase, mais cette partie n'est activee que si [supabase-config.js](/Users/gestionnairedeparcinformatique-valentin/Documents/Sarah/supabase-config.js) contient de vrais identifiants.

Les identifiants Supabase du projet sont maintenant renseignes dans la configuration locale du site. Il reste encore a executer le script SQL de preparation pour que la base et le stockage soient vraiment operationnels.

Cela veut dire :

- les rendez-vous sont conserves sur le navigateur utilise
- les photos sont stockees localement dans ce navigateur
- si on change d'appareil ou de navigateur, les donnees ne suivent pas
- le site est statique et heberge via GitHub Pages

## Fonctionnalites

### 1. Protection par code

Le site est bloque par un ecran d'acces au chargement.

- code actuel : `01052021`
- si le bon code est saisi, l'utilisateur entre dans le site
- l'acces reste ouvert pour la session en cours

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

### 7. Synchronisation Supabase

Le projet contient maintenant une integration Supabase pour :

- sauvegarder les rendez-vous en ligne
- sauvegarder les photos dans un bucket de stockage
- relire les rendez-vous depuis plusieurs appareils
- migrer automatiquement les donnees locales si Supabase est vide

Si Supabase n'est pas configure, le site repasse en mode local.

## Structure du projet

```text
.
├── README.md
├── SUPABASE_SETUP.md
├── index.html
├── rdv.html
├── supabase-config.js
├── supabase-setup.sql
└── assets/
    ├── leaflet/
    └── supabase/
```

### Fichiers principaux

- `index.html`
  page principale du site

- `rdv.html`
  redirection simple vers `index.html`

- `assets/leaflet/`
  copie locale de Leaflet pour eviter les erreurs de chargement externes

- `assets/supabase/`
  client Supabase embarque localement pour GitHub Pages

- `supabase-config.js`
  fichier de configuration du projet Supabase

- `supabase-setup.sql`
  script SQL pour creer la table, le bucket et les policies

- `SUPABASE_SETUP.md`
  guide pas a pas pour brancher Supabase

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

Le projet est prepare pour utiliser :

- [Supabase](https://supabase.com/docs/reference/javascript/initializing) pour la base et le stockage
- [Supabase Storage](https://supabase.com/docs/guides/storage) pour les photos
- des policies SQL de base pour un fonctionnement sans compte utilisateur

## Donnees enregistrees

Chaque rendez-vous enregistre contient actuellement une structure proche de :

```js
{
  id,
  title,
  date,
  location,
  coordinates,
  mapLink,
  note,
  photos,
  completed,
  completionNote,
  completionPhotos
}
```

Quand Supabase est actif, ces donnees sont stockees dans la table `date_events`.

## Fonctionnement local

Pour ouvrir le projet en local :

1. ouvrir `index.html`
2. entrer le code d'acces
3. ajouter ou consulter les rendez-vous

Le projet ne demande pas de build ni d'installation npm.

## Mise en ligne

Le projet est publie sur GitHub Pages.

- depot GitHub :
  [srkpwjd9m7-svg/sarah-rendez-vous](https://github.com/srkpwjd9m7-svg/sarah-rendez-vous)

- site en ligne :
  [https://srkpwjd9m7-svg.github.io/sarah-rendez-vous/](https://srkpwjd9m7-svg.github.io/sarah-rendez-vous/)

## Activation de Supabase

Pour activer la vraie sauvegarde en ligne :

1. ouvrir [SUPABASE_SETUP.md](/Users/gestionnairedeparcinformatique-valentin/Documents/Sarah/SUPABASE_SETUP.md)
2. remplir [supabase-config.js](/Users/gestionnairedeparcinformatique-valentin/Documents/Sarah/supabase-config.js)
3. executer [supabase-setup.sql](/Users/gestionnairedeparcinformatique-valentin/Documents/Sarah/supabase-setup.sql) dans Supabase
4. republier le site

Etat actuel :

- `Project URL` configure
- cle publique Supabase configuree
- script SQL encore a executer dans Supabase

## Limites actuelles

- pas de synchronisation entre plusieurs appareils
- pas de compte utilisateur
- pas de base de donnees distante
- pas de modification ou suppression d'un rendez-vous termine
- le code d'acces est visible dans le code source
- les donnees peuvent etre perdues si le stockage local du navigateur est vide

Ces limites changent partiellement quand Supabase est configure :

- la synchro multi-appareils devient possible
- les photos peuvent etre conservees en ligne

Mais il reste une limite importante :

- sans authentification utilisateur, la securite de la base reste basique

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

Les parties les plus importantes a surveiller sont :

- la logique de stockage local
- la logique de bascule local / Supabase
- la logique de separation `a venir / termines`
- la logique de carte et de reverse geocoding
- la protection par code

## Regle de travail demandee

Souhait utilisateur pour la suite :

- pousser les modifications sur GitHub automatiquement apres les changements, sans redemander confirmation
