# SailingLoc — API Backend

API REST pour la plateforme de location de bateaux entre particuliers SailingLoc.
Construite avec **Symfony 7.2** · **PHP 8.3** · **MySQL 8** · **JWT RSA**

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Symfony 7.2 |
| Langage | PHP 8.3 |
| Base de données | MySQL 8.0 |
| ORM | Doctrine ORM 3 |
| Authentification | LexikJWT 3 — access token RSA 15 min + refresh token 7 jours avec rotation |
| Sécurité | `UserChecker` (compte verrouillé), `LoginAttemptListener` (blocage après 10 tentatives / 15 min) |
| CORS | NelmioCorsBundle 2 |
| Paiements | Stripe PHP SDK 13 (PaymentIntent + Connect + webhooks) |
| Upload media | Cloudinary (service cURL maison) |
| Emails transactionnels | Resend API (service cURL maison) |
| Fixtures | DoctrineFixturesBundle |
| Migrations | DoctrineMigrationsBundle |

---

## Prérequis

- **PHP 8.3** avec les extensions `ctype`, `iconv`, `pdo_mysql`, `openssl`
- **Composer 2+**
- **MySQL 8.0+**
- **OpenSSL** (pour générer les clés JWT)
- [Symfony CLI](https://symfony.com/download) *(optionnel mais recommandé)*

---

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd sailingloc/backend
```

### 2. Installer les dépendances

```bash
composer install
```

### 3. Configurer les variables d'environnement

```bash
cp .env .env.local
```

Renseigner toutes les valeurs dans `.env.local` (voir la section [Variables d'environnement](#variables-denvironnement)).

### 4. Générer les clés JWT

```bash
mkdir -p config/jwt
openssl genpkey -algorithm RSA -out config/jwt/private.pem -pkeyopt rsa_keygen_bits:4096
openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem
```

Choisir une passphrase et la renseigner dans `JWT_PASSPHRASE` dans `.env.local`.

### 5. Créer la base de données et appliquer les migrations

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

### 6. Charger les données de test *(optionnel)*

```bash
php bin/console doctrine:fixtures:load
```

Crée environ 76 bateaux, des utilisateurs de test, des réservations et des avis.

### 7. Lancer le serveur de développement

```bash
symfony server:start --no-tls
# ou
php -S localhost:8000 -t public
```

L'API est disponible sur `http://localhost:8000/api`.

---

## Variables d'environnement

| Variable | Description | Valeur par défaut |
|---|---|---|
| `APP_ENV` | Environnement (`dev` / `prod`) | `dev` |
| `APP_SECRET` | Clé secrète Symfony (chaîne aléatoire 32 caractères) | — |
| `DATABASE_URL` | DSN MySQL | `mysql://root:root@127.0.0.1:3306/sailingloc?...` |
| `JWT_SECRET_KEY` | Chemin vers la clé privée RSA | `%kernel.project_dir%/config/jwt/private.pem` |
| `JWT_PUBLIC_KEY` | Chemin vers la clé publique RSA | `%kernel.project_dir%/config/jwt/public.pem` |
| `JWT_PASSPHRASE` | Passphrase de la clé JWT | — |
| `JWT_TTL` | Durée de l'access token en secondes | `900` *(15 min)* |
| `JWT_REFRESH_TTL` | Durée du refresh token en secondes | `604800` *(7 jours)* |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe | `whsec_...` |
| `STRIPE_PLATFORM_FEE_PERCENT` | Commission prélevée par la plateforme (%) | `15` |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary | — |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | — |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary | — |
| `RESEND_API_KEY` | Clé API Resend (emails) | `re_...` |
| `MAIL_FROM` | Adresse expéditeur des emails | `noreply@sailingloc.fr` |
| `CORS_ALLOW_ORIGIN` | Regex des origines CORS autorisées | `'^https?://(localhost\|127\.0\.0\.1)(:[0-9]+)?$'` |
| `FRONTEND_URL` | URL du frontend (utilisée dans les liens d'emails) | `http://localhost:5173` |

---

## Endpoints API

Toutes les routes sont préfixées par `/api`.
Les routes protégées requièrent un header `Authorization: Bearer <accessToken>`.

### Authentification

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Créer un compte (envoie un email de vérification) |
| `POST` | `/api/auth/login` | — | Se connecter (retourne access + refresh token + user) |
| `POST` | `/api/auth/refresh` | — | Renouveler l'access token via le refresh token |
| `POST` | `/api/auth/logout` | Oui | Invalider le refresh token |
| `GET` | `/api/auth/me` | Oui | Profil de l'utilisateur connecté |
| `GET` | `/api/auth/verify-email` | — | Vérifier l'adresse email via token (`?token=xxx`) |
| `POST` | `/api/auth/resend-verification` | Oui | Renvoyer l'email de vérification |
| `POST` | `/api/auth/change-password` | Oui | Changer le mot de passe |

### Bateaux

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/boats` | — | Lister les bateaux (filtres, pagination) |
| `GET` | `/api/boats/{id}` | — | Détail d'un bateau |
| `GET` | `/api/boats/my` | OWNER | Mes bateaux |
| `POST` | `/api/boats` | OWNER | Créer un bateau |
| `PATCH` | `/api/boats/{id}` | OWNER | Modifier un bateau |
| `DELETE` | `/api/boats/{id}` | OWNER | Supprimer un bateau |

**Paramètres de recherche `GET /api/boats` :**

| Paramètre | Type | Description |
|---|---|---|
| `location` | string | Recherche dans `city` et `port` (LIKE insensible à la casse) |
| `types[]` | string[] | Types : `SAILBOAT`, `CATAMARAN`, `MOTORBOAT`, `INFLATABLE`, `YACHT`, `PONTOON`, `DINGHY` |
| `capacity` | number | Capacité minimale (nombre de personnes) |
| `minPrice` | number | Prix journalier minimum (€) |
| `maxPrice` | number | Prix journalier maximum (€) |
| `withSkipper` | boolean | `true` = avec skipper uniquement |
| `startDate` | date | Date de début de disponibilité (ISO 8601, ex: `2025-07-01`) |
| `endDate` | date | Date de fin de disponibilité (ISO 8601) |
| `sort` | string | `price_asc` · `price_desc` · `rating_desc` · `created_desc` |
| `page` | number | Numéro de page (défaut : `1`) |
| `limit` | number | Résultats par page (défaut : `10`, max : `50`) |

### Réservations

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | Oui | Créer une réservation (anti-race condition via transaction) |
| `GET` | `/api/bookings/renter` | Oui | Mes réservations (côté locataire) |
| `GET` | `/api/bookings/owner` | OWNER | Mes réservations (côté propriétaire) |
| `GET` | `/api/bookings/{id}` | Oui | Détail d'une réservation |
| `PATCH` | `/api/bookings/{id}/confirm` | OWNER | Confirmer une réservation |
| `PATCH` | `/api/bookings/{id}/cancel` | Oui | Annuler une réservation |
| `POST` | `/api/bookings/{id}/payment-intent` | Oui | Créer un PaymentIntent Stripe pour une réservation |

### Utilisateurs

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/profile` | Oui | Mon profil complet |
| `PATCH` | `/api/users/profile` | Oui | Modifier mon profil (firstName, lastName, phone, bio) |
| `POST` | `/api/users/avatar` | Oui | Mettre à jour l'avatar (Cloudinary) |
| `GET` | `/api/users/{id}/public` | — | Profil public d'un propriétaire |

### Favoris

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/favorites` | Oui | Mes favoris |
| `GET` | `/api/favorites/{boatId}/check` | Oui | Vérifier si un bateau est en favori |
| `POST` | `/api/favorites/{boatId}` | Oui | Ajouter un favori |
| `DELETE` | `/api/favorites/{boatId}` | Oui | Retirer un favori |

### Avis

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reviews/boat/{boatId}` | — | Avis d'un bateau |
| `GET` | `/api/reviews/owner/{ownerId}` | — | Avis reçus par un propriétaire |
| `POST` | `/api/reviews` | Oui | Laisser un avis après réservation |

### Notifications

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Oui | Mes notifications (paginées) |
| `GET` | `/api/notifications/unread-count` | Oui | Nombre de notifications non lues |
| `PATCH` | `/api/notifications/{id}/read` | Oui | Marquer une notification comme lue |
| `PATCH` | `/api/notifications/read-all` | Oui | Tout marquer comme lu |
| `DELETE` | `/api/notifications/{id}` | Oui | Supprimer une notification |

### Disponibilités

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/availability/{boatId}` | — | Périodes d'indisponibilité d'un bateau |
| `POST` | `/api/availability` | OWNER | Bloquer une période |
| `DELETE` | `/api/availability/{id}` | OWNER | Débloquer une période |

### Tarifs saisonniers

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/seasonal-prices/{boatId}` | OWNER | Tarifs saisonniers d'un bateau |
| `POST` | `/api/seasonal-prices` | OWNER | Créer un tarif saisonnier |
| `PUT` | `/api/seasonal-prices/{id}` | OWNER | Modifier un tarif saisonnier |
| `DELETE` | `/api/seasonal-prices/{id}` | OWNER | Supprimer un tarif saisonnier |

### Messagerie

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/conversations` | Oui | Lister toutes les conversations |
| `GET` | `/api/messages/conversation/{id}` | Oui | Messages d'une conversation (paginés) |
| `POST` | `/api/messages` | Oui | Envoyer un message (crée la conversation si absente) |

**Corps `POST /api/messages` :**
```json
{
  "receiverId": 42,
  "content": "Bonjour, le bateau est-il disponible ?",
  "conversationId": "uuid..."
}
```

### Paiements (Stripe)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payments/webhook` | — | Webhook Stripe signé (HMAC) |

### Signalements

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/reports` | Oui | Signaler une annonce |
| `GET` | `/api/admin/reports` | ADMIN | Lister les signalements |
| `PATCH` | `/api/admin/reports/{id}` | ADMIN | Traiter un signalement |

### KYC

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/kyc/submit` | Oui | Soumettre les documents KYC |
| `GET` | `/api/kyc/status` | Oui | Statut de vérification KYC |

### Administration

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | ADMIN | Statistiques globales (users, boats, bookings, revenus) |
| `GET` | `/api/admin/users` | ADMIN | Lister tous les utilisateurs (paginé, recherche) |
| `PATCH` | `/api/admin/users/{id}` | ADMIN | Modifier / suspendre un utilisateur |
| `GET` | `/api/admin/boats` | ADMIN | Lister tous les bateaux |
| `PATCH` | `/api/admin/boats/{id}/status` | ADMIN | Changer le statut d'un bateau |
| `GET` | `/api/admin/bookings` | ADMIN | Lister toutes les réservations |

---

## Format des réponses

Toutes les réponses sont enveloppées dans un objet standard :

```json
// Succès
{ "success": true, "data": { ... } }

// Erreur
{ "success": false, "message": "Description de l'erreur" }

// Liste paginée
{
  "success": true,
  "data": {
    "data": [ ... ],
    "total": 76,
    "page": 1,
    "limit": 10,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

> **Exception :** `/api/auth/login` retourne directement `{ accessToken, refreshToken, user }` — géré par le firewall Symfony `json_login` + LexikJWT.

---

## Authentification JWT

Le système utilise deux tokens :

- **Access token** RSA (15 min) — envoyé dans `Authorization: Bearer <token>` à chaque requête protégée.
- **Refresh token** (7 jours, en base) — échangé contre un nouvel access token via `POST /api/auth/refresh`.

**Rotation activée** : chaque utilisation du refresh token génère un nouveau token et invalide l'ancien.

**Sécurité des comptes** :
- Blocage automatique après **10 tentatives de connexion échouées** (durée : 15 min) — géré par `LoginAttemptListener`
- Vérification de l'état du compte avant authentification — géré par `UserChecker`
- Email de vérification envoyé à l'inscription (token hexadécimal 64 chars, TTL 24h, usage unique)

**Règles mot de passe** (CNIL 2022 / NIST SP 800-63B) :
- Minimum 12 caractères, maximum 128
- Au moins une majuscule, une minuscule, un chiffre, un caractère spécial

---

## Commandes utiles

```bash
# Vider le cache
php bin/console cache:clear

# Générer une migration après modification d'entité
php bin/console doctrine:migrations:diff

# Appliquer les migrations
php bin/console doctrine:migrations:migrate

# Recharger les fixtures (supprime les données existantes)
php bin/console doctrine:fixtures:load

# Afficher toutes les routes
php bin/console debug:router --show-controllers

# Démarrer le serveur de développement
symfony server:start --no-tls
```

---

## Structure du projet

```
backend/
├── config/
│   ├── jwt/                     # Clés RSA (non versionnées)
│   ├── packages/                # Configuration des bundles Symfony
│   │   ├── security.yaml        # Firewalls, access_control, UserChecker
│   │   ├── doctrine.yaml
│   │   ├── rate_limiter.yaml    # Rate limiting (bookings : 20/h)
│   │   └── lexik_jwt_authentication.yaml
│   └── services.yaml            # Injection de dépendances
├── migrations/                  # Migrations Doctrine (versionnées)
├── public/
│   └── index.php                # Point d'entrée unique
├── src/
│   ├── Controller/              # Un controller par ressource
│   │   ├── AbstractApiController.php  # success(), error(), paginated(), getJsonBody()
│   │   ├── AuthController.php         # register, login, refresh, logout, verify-email, resend
│   │   ├── BoatController.php
│   │   ├── BookingController.php      # Anti-race condition via wrapInTransaction
│   │   ├── MessageController.php
│   │   ├── SeasonalPriceController.php
│   │   ├── ReportController.php
│   │   └── ...
│   ├── DataFixtures/
│   │   └── AppFixtures.php      # ~76 bateaux, 8 utilisateurs, réservations, avis
│   ├── Entity/                  # Entités Doctrine
│   │   ├── User.php             # emailVerifiedAt, failedLoginAttempts, lockedUntil
│   │   ├── EmailVerificationToken.php
│   │   ├── Boat.php
│   │   ├── Booking.php
│   │   ├── SeasonalPrice.php
│   │   ├── Report.php
│   │   └── ...
│   ├── EventListener/
│   │   ├── AuthenticationSuccessListener.php  # Enrichit la réponse JWT login (refreshToken + user)
│   │   ├── ExceptionListener.php              # Normalise les exceptions en JSON pour /api
│   │   ├── JWTCreatedListener.php             # Ajoute id, role, firstName, lastName au payload
│   │   └── LoginAttemptListener.php           # Compte les échecs, verrouille après 10 tentatives
│   ├── Repository/
│   ├── Security/
│   │   └── UserChecker.php      # Vérifie isActive() et isLocked() avant authentification
│   └── Service/
│       ├── AuthService.php      # createUser, createRefreshToken, rotateRefreshToken
│       ├── StripeService.php    # createPaymentIntent, cancelPaymentIntent, createRefund
│       ├── CloudinaryService.php
│       └── EmailService.php     # sendEmailVerification, sendBookingConfirmation, …
├── var/                         # Cache et logs (non versionné)
├── vendor/                      # Dépendances Composer (non versionné)
├── .env                         # Variables par défaut (versionnées, sans secrets)
├── .env.local                   # Surcharges locales (non versionné)
└── composer.json
```

---

## Comptes de démonstration

Après `php bin/console doctrine:fixtures:load` :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@sailingloc.fr` | `Admin@Sail2026!` |
| Propriétaire | `owner@demo.fr` | `Owner@Sail2026!` |
| Locataire | `renter@demo.fr` | `Renter@Sail2026!` |

Tous les comptes de démo ont leur email pré-vérifié (`emailVerifiedAt` défini).

> Mots de passe conformes CNIL 2022 : ≥ 12 caractères, majuscule, minuscule, chiffre, caractère spécial.

---

## Déploiement (Railway)

```bash
# Build
composer install --no-dev --optimize-autoloader
php bin/console cache:warmup --env=prod
php bin/console doctrine:migrations:migrate --no-interaction

# Start
php -S 0.0.0.0:$PORT public/index.php
```

Healthcheck : `GET /api/health`

---

*Projet étudiant DSP4 — Aucune transaction financière réelle (mode test Stripe)*
