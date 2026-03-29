# Lumiel

Application web de présentation et de gestion pour un accompagnement bien-être : site vitrine, prise de rendez-vous et tableau de bord administrateur.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)
[![date-fns](https://img.shields.io/badge/date--fns-4-770000?logo=javascript&logoColor=white)](https://date-fns.org/)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)

## Stack technique

| Domaine | Outils |
|--------|--------|
| Interface | React 19, TypeScript |
| Build & dev | Vite 8 |
| Données & auth | Supabase (`@supabase/supabase-js`) |
| Navigation | React Router 7 |
| Calendrier | react-big-calendar, date-fns (locale `fr`) |
| Qualité | ESLint 9, TypeScript strict |

## Fonctionnalités

### Site public

- **Accueil** — Présentation de l’approche et du cadre d’accompagnement.
- **À propos** — Page dédiée à la présentation.
- **Prestations & tarifs** — Liste des prestations (nom, description, durée, prix ou « sur devis »), chargée depuis Supabase.
- **Témoignages** — Page dédiée aux retours clients ; envoi d’un avis soumis à un consentement explicite (publication après modération), avec lien vers la politique de confidentialité.
- **Blog** — Consultation des contenus blog.
- **Contact & FAQ** — Formulaire (relai e-mail tiers) et questions fréquentes ; consentement obligatoire au traitement des données avant envoi.
- **Confidentialité** — Page `/confidentialite` : politique de confidentialité (RGPD), lien en pied de page sur tout le site public.

### Réservation

- **Prise de rendez-vous** (depuis la page prestations) — Choix d’une date, d’un créneau libre en fonction des réservations existantes et de la durée de la prestation, puis formulaire pour confirmer le rendez-vous (consentement au traitement des données requis).

### Administration (dashboard)

Accès réservé aux comptes présents dans la table Supabase `admins` (connexion par e-mail via Supabase Auth).

En **tablette et mobile** (≤ 1024px), la barre latérale devient un **burger menu** : bouton en-tête, voile assombri, fermeture par clic extérieur, choix d’un onglet ou touche Échap.

- **Statistiques** — Vue d’ensemble : nombre d’avis, prestations réalisées (rendez-vous passés), prestations en attente (rendez-vous à venir) ; graphique « prestations par type » (camembert) ; liste paginée des prochains rendez-vous.
- **Blog** — Création, édition et suppression des articles (`blog_posts`). Image de couverture optionnelle via **Supabase Storage** (bucket dédié, voir configuration du projet).
- **Avis** — Liste des avis, validation / invalidation et suppression.
- **Calendrier** — Agenda des rendez-vous (react-big-calendar) et gestion des disponibilités. Sur tablette / mobile, les jours avec disponibilité sont surtout repérables par la **couleur de la case** (pastille masquée).
- **Prestations** — Création, édition et suppression des prestations (tarif, durée, couleur, description).
- **Clients** — Fiches clients : coordonnées, notes privées sur la fiche, notes après séance ; association des rendez-vous du calendrier lorsque l’e-mail ou le portable correspond.

## Prérequis

- [Node.js](https://nodejs.org/) (version LTS recommandée)
- Un projet [Supabase](https://supabase.com/) avec au minimum :
  - table `admins` (contrôle d’accès au dashboard) ;
  - données métier utilisées par l’app : `prestations`, `rendez_vous`, `disponibilites`, `avis`, `blog_posts`, `clients`, `client_seance_notes` ;
  - politiques RLS et, pour le blog, **Storage** si vous utilisez les images d’article.

## Installation

```bash
npm install
```

### Variables d’environnement

Créer un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

Variables **optionnelles** affichées sur la page de confidentialité (sinon valeurs par défaut / placeholders dans `src/config/legal.ts`) :

```env
VITE_RGPD_CONTROLLER_NAME=Nom ou raison sociale
VITE_RGPD_CONTACT_EMAIL=contact@exemple.fr
VITE_RGPD_CONTROLLER_ADDRESS=Adresse, code postal, ville, pays
```

## Confidentialité (RGPD)

- **Politique** — Contenu éditorial sur `/confidentialite` ; personnaliser `src/config/legal.ts` ou les variables `VITE_RGPD_*` ci-dessus.
- **Bandeau** — Information cookies / traceurs et mention des polices Google Fonts au premier chargement (accusé stocké en `localStorage`).
- **Formulaires** — Cases à cocher et liens vers la politique sur le contact, la réservation publique et les témoignages.

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (Vite) |
| `npm run build` | Compilation TypeScript + build de production |
| `npm run preview` | Prévisualisation du build local |
| `npm run lint` | Analyse ESLint |

## Développement

### Boutons harmonisés

Le composant **`Button`** et le lien stylé **`ButtonLink`** (`src/components/button/`) partagent les styles **`Button.css`** (classes `lumiel-btn`, `lumiel-btn--primary`, etc.). Les utiliser sur le dashboard, les modales et les formulaires publics qui doivent garder le même langage visuel. La fonction **`lumielButtonClassName`** permet d’appliquer les mêmes classes à un élément personnalisé si besoin.

## Licence

Projet privé (`private` dans `package.json`).
