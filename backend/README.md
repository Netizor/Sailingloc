# SailingLoc — Backend Node.js + Express + Supabase

Backend API REST remplaçant l'ancien backend Symfony. Construit sur **Node.js 20 + Express 4 + Supabase (PostgreSQL)**.

## Stack

| Couche | Techno |
|---|---|
| Runtime | Node.js ≥ 20 |
| Framework | Express 4 |
| Base de données | Supabase (PostgreSQL) |
| Auth | JWT maison (jsonwebtoken) + refresh tokens en BDD |
| Upload images | Cloudinary |
| Paiements | Stripe |
| Emails | Resend (ou SMTP) |

---

## Installation

```bash
cd sailingloc-backend
npm install
cp .env.example .env
# Remplissez les variables dans .env
```

## Configuration `.env`

| Variable | Description |
|---|---|
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (Settings → API dans Supabase) |
| `JWT_SECRET` | Chaîne aléatoire ≥ 32 caractères |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe |
| `CLOUDINARY_CLOUD_NAME` | Nom cloud Cloudinary |
| `CLOUDINARY_API_KEY` | API key Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary |
| `RESEND_API_KEY` | Clé API Resend (email) |
| `FRONTEND_URL` | URL du frontend (CORS) |

## Base de données

1. Ouvrir l'éditeur SQL de votre projet Supabase
2. Copier-coller le contenu de `supabase_migration.sql`
3. Exécuter

## Démarrage

```bash
# Développement (rechargement auto)
npm run dev

# Production
npm start
```

## Routes API

### Auth — `/api/auth`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Inscription |
| POST | `/login` | — | Connexion |
| POST | `/logout` | — | Déconnexion (révoque refresh token) |
| POST | `/refresh` | — | Nouveau access token via refresh token |
| GET | `/me` | ✓ | Profil courant |
| POST | `/forgot-password` | — | Lien reset email |
| POST | `/reset-password` | — | Réinitialiser le mot de passe |
| GET | `/verify-email` | — | Vérifier email via token |
| POST | `/resend-verification` | ✓ | Renvoyer email de vérification |
| POST | `/hibp-check` | ✓ | Vérifier si le mot de passe est compromis (HIBP) |

### Bateaux — `/api/boats`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | opt. | Liste publique avec filtres + pagination |
| GET | `/my` | OWNER | Mes bateaux |
| GET | `/:id` | opt. | Détail d'un bateau |
| POST | `/` | OWNER | Créer un bateau |
| PATCH | `/:id` | OWNER | Modifier un bateau |
| DELETE | `/:id` | OWNER | Désactiver un bateau |
| POST | `/:id/images` | OWNER | Upload images (multipart) |

### Réservations — `/api/bookings`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/` | ✓ | Créer une réservation |
| POST | `/:id/payment-intent` | ✓ | Créer un Stripe PaymentIntent |
| POST | `/confirm-payment` | ✓ | Confirmer le paiement |
| GET | `/my` | ✓ | Mes réservations (locataire) |
| GET | `/owner` | OWNER | Réservations de mes bateaux |
| GET | `/:id` | ✓ | Détail d'une réservation |
| PATCH | `/:id/status` | ✓ | Changer le statut |

### Autres
- `/api/users` — profil, mot de passe, avatar, profil public
- `/api/reviews` — avis
- `/api/messages` — messagerie
- `/api/favorites` — favoris
- `/api/availability` — disponibilités
- `/api/seasonal-prices` — prix saisonniers
- `/api/notifications` — notifications
- `/api/admin` — administration (ADMIN uniquement)
- `/api/reports` — signalements
- `/api/sitemap.xml` — sitemap SEO
- `/api/robots.txt` — robots.txt SEO
- `/api/health` — healthcheck
- `/api/stripe/webhook` — webhook Stripe

## Webhook Stripe

Configurer l'URL du webhook dans le dashboard Stripe :
```
https://votre-domaine.com/api/stripe/webhook
```

Événements à activer : `payment_intent.succeeded`

## Adapter le frontend

Dans le frontend React, l'URL de base de l'API est définie dans `src/lib/axios.ts`.
Remplacer l'URL par celle du backend Node.js :
```
VITE_API_URL=http://localhost:3000/api
```

Le format des réponses (tokens, champs utilisateur...) est identique à l'ancien backend Symfony,
donc aucune modification des fichiers `*.api.ts` n'est nécessaire côté frontend.
