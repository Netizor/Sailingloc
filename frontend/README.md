# SailingLoc — Frontend

Interface utilisateur de la plateforme de location de bateaux entre particuliers SailingLoc.
Construite avec **React 18** · **TypeScript** · **Vite** · **Tailwind CSS**

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | React 18 |
| Langage | TypeScript 5 |
| Build | Vite 6 |
| Styles | Tailwind CSS 4 |
| Routing | React Router v6 |
| État global | Zustand (auth persisté en localStorage) |
| Requêtes API | TanStack Query v5 + Axios |
| Paiements | Stripe.js + @stripe/react-stripe-js |
| Cartes | Leaflet + react-leaflet |
| Calendrier | react-day-picker |
| Internationalisation | i18next + react-i18next (fr / en) |
| Icônes | lucide-react |
| Toasts | react-hot-toast |
| SEO | react-helmet-async |
| PWA | vite-plugin-pwa (Workbox) |

---

## Prérequis

- **Node.js 18+**
- **npm 9+**

---

## Installation

### 1. Installer les dépendances

```bash
cd sailingloc/frontend
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de l'API backend (ex: `http://localhost:8000`) |
| `VITE_STRIPE_PUBLIC_KEY` | Clé publique Stripe (ex: `pk_test_...`) |

### 3. Lancer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

---

## Lancer l'application complète (frontend + backend)

Depuis la racine du projet :

```bash
npm run dev
```

Démarre Symfony (port 8000) et Vite (port 5173) en parallèle via `concurrently`.

---

## Architecture

### Authentification

- JWT RSA stocké en `localStorage` via Zustand + `persist`
- Refresh token automatique sur 401 avec file d'attente des requêtes (`src/lib/axios.ts`)
- Guard de session : si "Se souvenir de moi" non coché, déconnexion automatique à la fermeture du navigateur

### Gestion du profil

`useProfileCompletion` (hook central) expose :
- `canBook` — toujours `true`, aucune restriction pour réserver
- `canManageBoat` — propriétaires uniquement : email vérifié + téléphone requis
- `issues[]` — liste des actions manquantes, affichées dans `BlockedModal` ou `DisabledTooltip`

### Structure des dossiers

```
src/
├── api/               # Fonctions d'appel API (une par ressource)
├── components/
│   ├── boats/         # SearchBar, BoatCard, BookingForm, ImageGallery…
│   ├── bookings/      # StripePaymentModal, PriceBreakdown
│   ├── layout/        # Header, Footer, Layout, VerificationBanner
│   ├── notifications/ # NotificationPanel
│   └── ui/            # Button, Badge, Modal, Stars, Spinner, DisabledTooltip, BlockedModal…
├── hooks/             # useProfileCompletion, useTheme, useSavedSearches, usePageTitle…
├── i18n/              # Configuration i18next + locales fr.json / en.json
├── lib/               # axios.ts, utils.ts, labels.ts, exportCsv.ts, generateInvoice.ts
├── pages/
│   ├── admin/         # AdminDashboard, AdminUsers, AdminBoats, AdminBookings, AdminReports
│   ├── auth/          # Login, Register, ResetPassword, VerifyEmail
│   ├── dashboard/     # MyBookings, BookingDetail, MyFavorites, Messages, Conversation…
│   └── owner/         # MyBoats, CreateEditBoat, ManageAvailability, ManageSeasonalPrices…
├── store/             # auth.store.ts (Zustand), compare.store.ts
├── types/             # index.ts — interfaces TypeScript
└── App.tsx            # Routes React Router v6
```

---

## Fonctionnalités implémentées

### Locataire

| Code | Page / Composant | Description |
|---|---|---|
| A1 | `/mon-espace/favoris` | Favoris |
| A2 | `/mon-espace/reservations/:id` | Détail réservation + téléchargement facture PDF |
| A3 | `/mon-espace/reservations/:id/avis` | Laisser un avis |
| A4 | `BoatAvailabilityCalendar` | Calendrier de disponibilité dans la fiche bateau |
| A5 | `BoatDetail` | Partage natif (Web Share API) |
| A6 | `/mon-espace/messages` + `/mon-espace/messages/:id` | Messagerie + badge non lus dans le Header |
| A7 | `OnboardingModal` | Modale d'accueil propriétaire (localStorage) |
| A8 | `/comparer` | Comparateur de bateaux (barre flottante + page) |
| B1 | `/bateaux` | Vue carte Leaflet/OSM en toggle avec la liste |
| B2 | PWA | Manifest + Workbox (Service Worker) |
| C2 | `BookingDetail` | Modale d'annulation de réservation |
| C9 | `/mon-espace/alertes` | Recherches sauvegardées |

### Propriétaire

| Code | Page / Composant | Description |
|---|---|---|
| — | `/proprietaire/bateaux` | Mes bateaux (statuts, tarifs, étoiles) |
| — | `/proprietaire/bateaux/nouveau` | Créer un bateau (stepper 5 étapes) |
| — | `/proprietaire/bateaux/:id/editer` | Modifier un bateau |
| — | `/proprietaire/bateaux/:id/disponibilites` | Gérer les disponibilités + stats d'occupation |
| C5 | `/proprietaire/bateaux/:id/tarifs` | Tarifs saisonniers |
| — | `/proprietaire/reservations` | Mes réservations en tant que propriétaire |
| — | `/proprietaire/revenus` | Revenus + export CSV |

### Compte & profil

| Code | Page | Description |
|---|---|---|
| — | `/connexion`, `/inscription` | Auth avec indicateur de force du mot de passe |
| — | `/verifier-email` | Vérification d'email via lien (token 24h) |
| — | `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe` | Réinitialisation mot de passe |
| — | `/mon-espace/profil` | Profil utilisateur éditable |
| C1 | `/mon-espace/verification` | Vérification KYC |
| C11 | Header | Dark mode (toggle Lune/Soleil) |
| C12 | Header | Internationalisation FR / EN |

### Catalogue & pages publiques

| Code | Page | Description |
|---|---|---|
| — | `/` | Page d'accueil |
| — | `/bateaux` | Recherche avec filtres avancés |
| — | `/bateaux/:id` | Fiche bateau (galerie, booking Stripe, carte, avis, bateaux similaires) |
| C3 | `/proprietaires/:id` | Profil public d'un propriétaire |
| C8 | `SimilarBoats` | Bateaux similaires dans la fiche |
| C10 | `/destinations` + `/destinations/:port` | Pages destinations |
| C13 | `BoatDetail` | Signalement d'annonce |

### Administration

| Code | Page | Description |
|---|---|---|
| — | `/admin/dashboard` | Statistiques globales |
| — | `/admin/utilisateurs` | Gestion des utilisateurs |
| — | `/admin/bateaux` | Modération des bateaux (statuts) |
| — | `/admin/reservations` | Toutes les réservations |
| — | `/admin/signalements` | Gestion des signalements |

---

## Sécurité — blocage des actions protégées

Les actions nécessitant un profil complet (propriétaires) sont bloquées de deux façons :

- **Bouton sur une page accessible** → `DisabledTooltip` : grise le bouton + tooltip au survol
- **Page entière inaccessible** → `BlockedModal` : overlay flouté non fermable avec liste des actions requises

---

## Règles mot de passe (CNIL 2022 / NIST SP 800-63B)

- Minimum 12 caractères, maximum 128
- Au moins une majuscule, une minuscule, un chiffre, un caractère spécial
- Indicateur visuel de force (5 barres + checklist) affiché à l'inscription

---

## Build production

```bash
npm run build      # génère dist/
npm run preview    # prévisualise le build
```

---

*Projet étudiant DSP4 — Aucune transaction financière réelle (mode test Stripe)*
