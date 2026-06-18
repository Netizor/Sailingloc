# ⛵ SailingLoc

> Plateforme de location de bateaux entre particuliers — *"l'Airbnb des bateaux"* pour les ports français et européens.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Symfony](https://img.shields.io/badge/Symfony-7.2-000000?logo=symfony&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
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
├── backend/           # API REST Symfony — déployée sur Railway
│   ├── src/
│   │   ├── Controller/
│   │   ├── Entity/
│   │   ├── Repository/
│   │   ├── Service/
│   │   └── EventListener/
│   ├── config/
│   └── migrations/
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
| Symfony 7.2 | Framework PHP |
| PHP 8.3 | Langage |
| Doctrine ORM | ORM + Migrations |
| MySQL 8.0 | Base de données |
| LexikJWTAuthenticationBundle | Auth JWT RSA 4096 bits |
| NelmioCorsBundle | CORS |
| NelmioApiDocBundle | Documentation OpenAPI 3.0 |
| Stripe PHP SDK | Paiements + Connect + Webhooks |
| Cloudinary (cURL) | Stockage médias |
| Resend (cURL) | Emails transactionnels |
| Symfony Rate Limiter | Protection anti-abus |

---

## Prérequis

- **Node.js 18+** et **npm 9+**
- **PHP 8.3** avec extensions : `pdo_mysql`, `openssl`, `ctype`, `iconv`, `curl`
- **Composer 2+**
- **Symfony CLI** (recommandé pour le serveur de développement)
- **MySQL 8.0+**

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
cd backend && composer install && cd ..
```

### 3. Configurer les variables d'environnement

```bash
# Backend
cp backend/.env backend/.env.local
# → Renseigner DATABASE_URL, STRIPE_*, CLOUDINARY_*, RESEND_*, etc.

# Frontend
cp frontend/.env.example frontend/.env.local
# → Renseigner VITE_API_URL, VITE_STRIPE_PUBLIC_KEY
```

### 4. Générer les clés JWT

```bash
cd backend
mkdir -p config/jwt
openssl genpkey -algorithm RSA -out config/jwt/private.pem -pkeyopt rsa_keygen_bits:4096
openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem
cd ..
```

Ou via la commande Symfony :

```bash
cd backend && php bin/console lexik:jwt:generate-keypair && cd ..
```

### 5. Créer la base de données

```bash
cd backend
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load   # optionnel — données de démonstration
cd ..
```

### 6. Lancer les deux serveurs

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Vite) | `http://localhost:5173` |
| Backend (API) | `http://localhost:8000/api` |
| Documentation API | `http://localhost:8000/api/doc` |

---

## Variables d'environnement

### Backend (`backend/.env.local`)

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | DSN MySQL | `mysql://user:pass@127.0.0.1:3306/sailingloc` |
| `JWT_SECRET_KEY` | Chemin clé privée RSA | `%kernel.project_dir%/config/jwt/private.pem` |
| `JWT_PUBLIC_KEY` | Chemin clé publique RSA | `%kernel.project_dir%/config/jwt/public.pem` |
| `JWT_PASSPHRASE` | Passphrase de la clé | `your-passphrase` |
| `JWT_TTL` | Durée access token (secondes) | `900` |
| `JWT_REFRESH_TTL` | Durée refresh token (secondes) | `604800` |
| `CORS_ALLOW_ORIGIN` | Regex origines CORS | `^https://sailingloc\.vercel\.app$` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | `whsec_...` |
| `STRIPE_PLATFORM_FEE_PERCENT` | Commission plateforme (%) | `15` |
| `CLOUDINARY_CLOUD_NAME` | Cloud Cloudinary | `my-cloud` |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | `123456789` |
| `CLOUDINARY_API_SECRET` | Secret Cloudinary | `abc...` |
| `RESEND_API_KEY` | Clé API Resend | `re_...` |
| `MAIL_FROM` | Adresse expéditeur | `noreply@sailingloc.fr` |
| `FRONTEND_URL` | URL frontend (liens emails) | `https://sailingloc.vercel.app` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Exemple |
|---|---|---|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:8000` |
| `VITE_STRIPE_PUBLIC_KEY` | Clé publique Stripe | `pk_test_...` |

---

## Comptes de démonstration

Après `php bin/console doctrine:fixtures:load` :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@sailingloc.fr` | `Admin@Sail2026!` |
| Propriétaire | `owner@demo.fr` | `Owner@Sail2026!` |
| Locataire | `renter@demo.fr` | `Renter@Sail2026!` |

Créer / réinitialiser ces comptes dans Supabase :

```bash
cd backend
npm run db:seed          # crée seulement si absents
npm run db:seed:force    # réinitialise aussi les mots de passe
```

> Les mots de passe respectent la politique CNIL 2022 : 12 caractères minimum, majuscule, minuscule, chiffre, caractère spécial.

---

## Documentation API

La documentation interactive (Swagger UI) est disponible en local à l'adresse :

```
http://localhost:8000/api/doc
```

Elle permet de :
- Explorer tous les endpoints avec leurs paramètres et réponses documentés
- Tester les requêtes directement depuis le navigateur (playground)
- Visualiser les réponses en JSON ou YAML
- S'authentifier avec un JWT Bearer token

> En production, la documentation est désactivée pour des raisons de sécurité.

---

## Déploiement

### Backend (Railway)

```bash
# Build
composer install --no-dev --optimize-autoloader
php bin/console cache:warmup --env=prod
php bin/console doctrine:migrations:migrate --no-interaction --env=prod

# Start
php -S 0.0.0.0:$PORT public/index.php
```

Healthcheck : `GET /api/health`

### Frontend (Vercel)

```bash
# Build command
cd frontend && npm run build

# Output directory
frontend/dist
```

Variables d'environnement à configurer dans les dashboards respectifs (Railway / Vercel).

---

## Licence

Ce projet est distribué sous licence [MIT](./LICENSE).

> *Projet réalisé dans le cadre du DSP4 — Aucune transaction financière réelle (mode test Stripe).*
