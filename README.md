# ⛵ SailingLoc

> Plateforme de location de bateaux entre particuliers — *"l'Airbnb des bateaux"* pour les ports français et européens.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Sommaire

- [Aperçu](#aperçu)
- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Documentation API](#documentation-api)
- [Déploiement](#déploiement)
- [Licence](#licence)

---

## Aperçu

SailingLoc connecte des propriétaires de bateaux avec des locataires pour des locations courte ou longue durée. La plateforme gère l'ensemble du cycle de vie : annonces, disponibilités, réservations, paiements Stripe, messagerie temps réel, avis et notifications.

---

## Architecture

```
sailingloc/
├── frontend/          # SPA React — déployée sur Vercel
│   ├── src/
│   │   ├── api/       # Couche d'accès API (Axios)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── store/     # Zustand (auth, compare)
│   │   └── lib/       # axios, labels, utils
│   └── public/
├── backend/           # API REST Node/Express + Supabase — déployée sur Railway
│   ├── src/
│   │   ├── routes/    # auth, boats, bookings, users, kyc…
│   │   ├── middleware/
│   │   ├── services/
│   │   └── lib/       # supabase, helpers
│   └── scripts/       # seed données démo
└── package.json       # Lanceur racine (concurrently)
```

| Partie | Hébergement | URL |
|---|---|---|
| Frontend | Vercel | `https://sailingloc.vercel.app` |
| Backend (API) | Railway | `https://sailingloc-backend.railway.app` |

---

## Fonctionnalités

### Utilisateurs
- Inscription / connexion avec JWT (access token 15 min + refresh token 7 jours)
- Vérification d'email obligatoire
- Réinitialisation de mot de passe sécurisée
- Modification de profil, avatar, mot de passe
- Vérification d'identité (KYC)
- Détection de mots de passe compromis (HIBP — k-anonymity)
- Export des données personnelles (RGPD Art. 20)

### Bateaux
- Création et gestion d'annonces (photos, caractéristiques, documents)
- Gestion des disponibilités via calendrier interactif
- Tarifs saisonniers configurables
- Système de favoris
- Comparateur de bateaux

### Réservations
- Réservation avec vérification de disponibilité (transactions DB — anti double-booking)
- Paiement sécurisé via Stripe (PaymentIntent)
- Annulation par le locataire ou le propriétaire
- Validation automatique après séjour
- Revenus propriétaire avec export CSV

### Communication
- Messagerie privée en temps réel (Server-Sent Events)
- Notifications in-app
- Notifications push (Web Push / VAPID)
- Emails transactionnels (Resend)

### Social & Découverte
- Avis avec modération admin
- Signalement d'annonces
- Carte interactive (Leaflet / OpenStreetMap)
- Pages destinations
- Alertes de recherche sauvegardées

### Administration
- Tableau de bord (statistiques, revenus)
- Gestion utilisateurs, bateaux, réservations, avis, signalements
- Résolution de litiges

### Divers
- Mode sombre
- i18n (FR / EN)
- PWA (Service Worker, notifications push, installation mobile)
- SEO (sitemap.xml, robots.txt)
- Documentation API interactive (Swagger UI — `/api/doc`)

---

## Stack technique

### Frontend

| Technologie | Rôle |
|---|---|
| React 18 | UI |
| TypeScript 5.3 | Typage |
| Vite 5 | Build tool |
| Tailwind CSS 3 | Styles |
| React Router v6 | Routing |
| TanStack Query v5 | Data fetching & cache |
| Zustand | State management (auth, comparateur) |
| Axios | Client HTTP + refresh JWT automatique |
| Stripe.js | Paiements front |
| Leaflet + React Leaflet | Carte interactive |
| i18next | Internationalisation |
| vite-plugin-pwa | PWA / Service Worker |

### Backend

| Technologie | Rôle |
|---|---|
| Node.js 20 (ESM) | Runtime |
| Express 4 | Framework HTTP |
| Supabase (PostgreSQL) | Base de données + stockage |
| JWT (custom) | Auth — access 15 min / refresh 7 jours |
| Stripe Node SDK | Paiements + webhooks |
| Nodemailer / Resend | Emails transactionnels |
| express-rate-limit | Protection anti-abus |
| Swagger UI | Documentation API interactive |

---

## Prérequis

- **Node.js 20+** et **npm 9+**
- Un projet **Supabase** (base de données PostgreSQL gérée)
- Comptes **Stripe** et **Resend** (ou SMTP) pour les paiements et emails

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/<your-org>/sailingloc.git
cd sailingloc
```

### 2. Installer les dépendances

```bash
# Lanceur racine (concurrently)
npm install

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..
```

### 3. Configurer les variables d'environnement

```bash
# Backend
cp backend/.env.example backend/.env
# → Renseigner SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, STRIPE_*, etc.

# Frontend
cp frontend/.env.example frontend/.env.local
# → Renseigner VITE_API_URL, VITE_STRIPE_PUBLIC_KEY
```

### 4. Alimenter la base de données (optionnel)

```bash
cd backend
npm run db:seed          # crée les comptes de démo s'ils sont absents
```

### 5. Lancer les deux serveurs

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Vite) | `http://localhost:5173` |
| Backend (API) | `http://localhost:3000/api` |
| Documentation API | `http://localhost:3000/api/doc` |

---

## Variables d'environnement

### Backend (`backend/.env`)

| Variable | Description | Exemple |
|---|---|---|
| `SUPABASE_URL` | URL du projet Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase (privée) | `eyJ...` |
| `JWT_SECRET` | Secret de signature des tokens JWT | *(chaîne aléatoire longue)* |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | `whsec_...` |
| `STRIPE_PLATFORM_FEE_PERCENT` | Commission plateforme (%) | `15` |
| `RESEND_API_KEY` | Clé API Resend (emails) | `re_...` |
| `MAIL_FROM` | Adresse expéditeur | `SailingLoc <noreply@sailingloc.fr>` |
| `CONTACT_EMAIL` | Destination des messages de contact | `contact@sailingloc.fr` |
| `FRONTEND_URL` | URL frontend (liens dans les emails) | `https://sailingloc.vercel.app` |
| `PORT` | Port du serveur Express | `3000` |

> **Important :** `SUPABASE_SERVICE_ROLE_KEY` et `JWT_SECRET` sont des secrets à ne jamais committer.

### Frontend (`frontend/.env.local`)

| Variable | Description | Exemple |
|---|---|---|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:3000` |
| `VITE_STRIPE_PUBLIC_KEY` | Clé publique Stripe | `pk_test_...` |

---

## Comptes de démonstration

Après `npm run db:seed` dans le dossier `backend` :

| Rôle | Email |
|---|---|
| Admin | `admin@sailingloc.fr` |
| Propriétaire | `owner@demo.fr` |
| Locataire | `renter@demo.fr` |

Les mots de passe sont définis dans le script de seed (`backend/scripts/seed.js`). Ils respectent la politique CNIL 2022 : 12 caractères minimum, majuscule, minuscule, chiffre, caractère spécial.

---

## Documentation API

La documentation interactive (Swagger UI) est disponible en local à :

```
http://localhost:3000/api/doc
```

Elle permet de :
- Explorer tous les endpoints avec leurs paramètres et réponses documentés
- Tester les requêtes directement depuis le navigateur
- S'authentifier avec un JWT Bearer token

> En production, la documentation est désactivée pour des raisons de sécurité.

---

## Déploiement

### Backend (Railway)

Railway détecte automatiquement Node.js. Variables à configurer dans le dashboard Railway :
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `STRIPE_*`, `RESEND_API_KEY`, `MAIL_FROM`, `CONTACT_EMAIL`, `FRONTEND_URL`.

Commande de démarrage : définie dans `backend/package.json` (`start`).

Healthcheck : `GET /api/health`

### Frontend (Vercel)

```bash
# Build command
cd frontend && npm run build

# Output directory
frontend/dist
```

Variables à configurer dans le dashboard Vercel : `VITE_API_URL`, `VITE_STRIPE_PUBLIC_KEY`.

---

## Licence

Ce projet est distribué sous licence [MIT](./LICENSE).

> *Projet réalisé dans le cadre du DSP4 — Aucune transaction financière réelle (mode test Stripe).*
