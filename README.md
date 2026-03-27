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
- **Témoignages** — Page dédiée aux retours clients.
- **Blog** — Consultation des contenus blog.

### Réservation

- **Prise de rendez-vous** (depuis la page prestations) — Choix d’une date, d’un créneau libre en fonction des réservations existantes et de la durée de la prestation, puis formulaire de contact pour confirmer le rendez-vous.

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

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (Vite) |
| `npm run build` | Compilation TypeScript + build de production |
| `npm run preview` | Prévisualisation du build local |
| `npm run lint` | Analyse ESLint |

## Développement

### Boutons harmonisés (dashboard)

Les boutons du tableau de bord et des écrans qui partagent le même langage visuel (modales de confirmation, formulaires client / prestation / réservation côté admin, calendrier, blog, etc.) reposent sur **`src/page/dashboard/dash-buttons.css`**.

- **Base** : `.dash-btn`
- **Variantes** : `.dash-btn--primary`, `.dash-btn--secondary`, `.dash-btn--outline`, `.dash-btn--danger`, `.dash-btn--danger-solid`
- **Utilitaires** : `.dash-btn--sm`, `.dash-btn--pill`, `.dash-btn--block`, `.dash-btn--grow`

La feuille est chargée depuis **`DashboardPage.tsx`** (route `/dashboard`). Pour un composant utilisé ailleurs mais qui doit garder le même rendu (par exemple **`ConfirmModal`**, **`ReservationForm`**), importer explicitement `dash-buttons.css` depuis ce chemin.

## Licence

Projet privé (`private` dans `package.json`).
