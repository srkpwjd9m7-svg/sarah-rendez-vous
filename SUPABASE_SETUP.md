# Configuration Supabase

Ce fichier explique comment brancher le projet a Supabase pour que les rendez-vous et les photos restent disponibles apres un `push`, sur plusieurs appareils.

## Ce que le projet attend

Le site charge la configuration depuis [supabase-config.js](supabase-config.js).

Le point d'entree principal du site est maintenant :

- [index.html](index.html)

Le site reste bloque sur cette page tant que le mot de passe n'est pas entre.

Il faut remplir :

```js
window.SUPABASE_CONFIG = {
  url: "https://votre-projet.supabase.co",
  anonKey: "votre-anon-key"
};
```

## Etapes

### 1. Creer un projet Supabase

Dans Supabase, cree un nouveau projet.

### 2. Recuperer les identifiants

Depuis le dashboard Supabase :

- `Project URL`
- `anon` ou `publishable key`

Puis colle-les dans [supabase-config.js](supabase-config.js).

Etat actuel du projet :

- `Project URL` deja configure
- cle publique deja configuree
- [supabase-setup.sql](supabase-setup.sql) a ete execute
- la table `date_events` repond
- le bucket `date-memories` repond

### 3. Creer la table et le bucket

Ouvre le SQL Editor Supabase et execute le contenu de [supabase-setup.sql](supabase-setup.sql).

Ce script cree :

- la table `date_events`
- le bucket `date-memories`
- les policies minimales pour ce projet

### 4. Deployer

Pousser la nouvelle configuration sur `main` :

```bash
git add supabase-config.js
git commit -m "chore: update supabase config"
git push origin main
```

Le webhook GitHub declenche le deploy sur `lab.bourdat.fr/rdv` en ~2-5 s (5 min max via le cron de secours). Voir la section CI/CD du [README.md](README.md#mise-en-ligne-cicd).

## Important

Le site est actuellement un site statique public. Cela veut dire que :

- la cle `anon` est visible dans le code client
- la vraie protection doit venir des policies et du modele de securite

Pour cette premiere version, les policies sont ouvertes au role `anon` pour permettre au site de fonctionner sans compte utilisateur.

## Limite de securite actuelle

Le code secret du site protege l'interface, mais pas vraiment la base de donnees. Quelqu'un qui inspecte le code public peut retrouver les appels a Supabase.

Si tu veux une vraie securite ensuite, il faudra passer a l'une de ces solutions :

- Supabase Auth avec utilisateurs connectes
- Edge Functions
- backend prive entre le site et la base
