# F. Cahier des clauses techniques détaillées

## 1. Architecture globale de projet

### Les principales architectures existantes

**MERN** (MongoDB, Express, React, Node.js) est une architecture full JavaScript, du front-end au back-end. MongoDB stocke les données sous forme de documents JSON, Express gère les routes côté serveur, React construit l'interface utilisateur et Node.js fait tourner le serveur. C'est un stack populaire pour les applications temps réel et les startups qui veulent aller vite avec un seul langage sur toute la chaîne.

**MEAN** (MongoDB, Express, Angular, Node.js) fonctionne sur le même principe que MERN mais remplace React par Angular. Angular est un framework plus structuré et opinionné, adapté aux grandes équipes et aux projets d'entreprise nécessitant une architecture stricte.

**SEAN** (SQL, Express, Angular, Node.js) reprend la même logique mais remplace MongoDB par une base de données relationnelle SQL. C'est un choix pertinent quand les données sont structurées et que les relations entre entités sont nombreuses.

**MSSR** (MySQL, Symfony, SQL, React) est une architecture orientée PHP côté back-end avec Symfony comme framework principal, une base MySQL relationnelle et React en front-end. C'est un stack très utilisé dans l'écosystème français et européen.

**MSAA** (Microservices, SQL, API, Angular) repose sur une architecture en microservices où chaque fonctionnalité est un service indépendant communiquant via des API. Puissante et scalable, mais complexe à mettre en place.

**PSAA** (Python, SQL, API, Angular) utilise Python côté back-end (Django/FastAPI), une base SQL, une API REST et Angular en front-end. Appréciée pour les projets intégrant de l'intelligence artificielle ou du traitement de données.

**PERN** (PostgreSQL, Express, React, Node.js) est une architecture full JavaScript côté applicatif (Node.js/Express/React), avec PostgreSQL comme base relationnelle. Elle combine la rapidité de développement d'un stack JavaScript unifié avec la robustesse d'une base de données relationnelle, ce qui la rend pertinente pour des applications transactionnelles à données fortement relationnelles (réservations, utilisateurs, paiements).

### Comparatif des architectures

| Critère | MERN | MEAN | SEAN | MSSR | MSAA | PSAA | PERN |
|---|---|---|---|---|---|---|---|
| Base de données | NoSQL | NoSQL | SQL | SQL | SQL | SQL | SQL |
| Back-end | Node.js | Node.js | Node.js | Symfony/PHP | Microservices | Python | Node.js |
| Front-end | React | Angular | Angular | React | Angular | Angular | React |
| Scalabilité | Bonne | Bonne | Moyenne | Bonne | Excellente | Bonne | Bonne |
| Complexité | Faible | Moyenne | Moyenne | Moyenne | Élevée | Moyenne | Faible |
| Données relationnelles | Non | Non | Oui | Oui | Oui | Oui | Oui |
| Langage unique front/back | Oui | Oui | Oui | Non | Non | Non | Oui |
| Évolutivité mobile (API REST) | Oui | Oui | Oui | Oui | Oui | Oui | Oui |

### Architecture retenue : PERN + Supabase (BaaS)

Le projet SailingLoc a été initialement cadré sur une architecture **MSSR (MySQL + Symfony + React)**. Après le cadrage initial, l'équipe a fait évoluer ce choix vers une architecture **PERN (PostgreSQL + Express + React + Node.js)**, la base de données relationnelle étant hébergée et administrée via **Supabase**, une plateforme BaaS (Backend-as-a-Service) construite sur PostgreSQL.

Ce choix repose sur plusieurs critères :

- **Langage unique sur toute la chaîne** : l'équipe de trois développeurs travaille en JavaScript/TypeScript aussi bien côté front (React) que côté back (Node.js/Express), ce qui réduit le temps de montée en compétence et simplifie la relecture de code croisée entre les membres de l'équipe.
- **Réduction de la charge d'exploitation** : Supabase fournit une base PostgreSQL managée, des sauvegardes automatiques, une API PostgREST et une gestion fine des accès (Row Level Security), ce qui évite d'administrer soi-même un serveur MySQL/Doctrine et accélère l'itération sur un projet à délai contraint (calendrier étudiant).
- **Pertinence pour les données relationnelles** : le modèle de données de SailingLoc (utilisateurs, bateaux, réservations, avis, disponibilités, paiements) reste fortement relationnel ; PostgreSQL gère nativement ces relations, contraintes et transactions.
- **Compatibilité avec l'objectif mobile** : comme pour l'architecture initialement prévue, le back-end Node.js/Express expose une **API REST** découplée du front, ce qui permettra de connecter une application mobile (React Native, par exemple) sans refonte du back-end.
- **Écosystème mature** : Express, Supabase et Stripe disposent d'une documentation extensive et d'une large communauté, ce qui limite les risques de blocage technique pendant le développement.

SailingLoc adopte donc une architecture client-serveur en couches, avec une séparation nette entre le front-end (React), le back-end (Node.js/Express exposant une API REST) et la couche de données (PostgreSQL managé par Supabase), le tout complété par des services externes (Stripe, Cloudinary, Resend, Web Push).

**Schéma d'architecture (texte)**

```
Navigateur (Chrome, Firefox, Safari, Edge)
        │  HTTPS (443)
        ▼
Nginx (reverse proxy, VPS OVH, certificat Let's Encrypt)
   ├── / (statique)        → build React (Vite) servi directement
   └── /api (proxy_pass)   → Node.js / Express (port interne, ex. 4000)
                                   │
                                   ├── Supabase (PostgreSQL managé, hébergé hors VPS)
                                   ├── Stripe API (paiements)
                                   ├── Cloudinary (stockage images/documents)
                                   ├── Resend / SMTP (emails transactionnels)
                                   └── Web Push (VAPID, notifications navigateur)
```

Contrairement à l'architecture initialement documentée (base de données colocalisée sur le même serveur que l'application), **la base de données n'est pas hébergée sur le VPS** : elle est gérée par Supabase en tant que service externe managé, ce qui simplifie la maintenance (sauvegardes, montée de version, réplication) mais introduit une dépendance réseau à un service tiers, prise en compte dans l'analyse des risques.

---

## 2. Technologies de développement

### 2.1 Technologies de développement Front-end

| Techno | Rôle | Version |
|---|---|---|
| React | Bibliothèque UI, composants réutilisables, SPA | 18.2 |
| TypeScript | Typage statique du code front | 5.3 |
| Vite | Bundler / serveur de développement | 5.0 |
| React Router | Navigation côté client (SPA, sans rechargement) | 6.21 |
| TailwindCSS | Framework CSS utilitaire | 3.4 |
| Axios | Client HTTP pour les appels vers l'API REST | 1.6 |
| TanStack Query (React Query) | Cache et synchronisation des données serveur | 5.17 |
| Zustand | Gestion d'état client léger (auth, préférences, comparateur) | 4.5 |
| react-i18next / i18next | Internationalisation FR/EN de l'interface | 25.x |
| react-helmet-async | Gestion des balises meta pour le SEO | 3.0 |
| react-leaflet / Leaflet | Carte interactive (ports, localisation des bateaux) | 4.2 / 1.9 |
| react-day-picker | Calendrier de disponibilités et de réservation | 9.x |
| Recharts | Graphiques des tableaux de bord (revenus, KPI admin) | 3.x |
| Stripe.js / @stripe/react-stripe-js | Intégration du paiement en ligne côté client | 3.x / 2.4 |
| vite-plugin-pwa | Progressive Web App (manifest, service worker, installation) | 1.2 |

React permet de construire des interfaces dynamiques à base de composants réutilisables, sous forme de Single Page Application. TypeScript sécurise le typage des données échangées avec l'API. TailwindCSS accélère la construction d'une interface responsive cohérente avec la charte graphique.

Documentation officielle :
- https://react.dev
- https://www.typescriptlang.org/docs
- https://vitejs.dev
- https://reactrouter.com
- https://tailwindcss.com/docs
- https://axios-http.com
- https://tanstack.com/query/latest
- https://zustand-demo.pmnd.rs
- https://react.i18next.com
- https://leafletjs.com
- https://stripe.com/docs/js

### 2.2 Technologies de développement Backend

| Techno | Rôle | Version |
|---|---|---|
| Node.js | Environnement d'exécution JavaScript serveur | ≥ 20 (LTS) |
| Express | Framework web, exposition de l'API REST | 4.19 |
| jsonwebtoken | Génération et vérification des tokens JWT (access token) | 9.0 |
| bcryptjs | Hachage des mots de passe | 2.4 |
| helmet | En-têtes HTTP de sécurité | 7.1 |
| cors | Contrôle des origines autorisées à appeler l'API | 2.8 |
| express-rate-limit | Limitation du nombre de requêtes (anti brute-force) | 7.3 |
| zod | Validation des schémas de données entrantes | 3.23 |
| multer | Gestion des uploads multipart (avant envoi vers Cloudinary) | 2.1 |
| uuid | Génération d'identifiants uniques (refresh tokens, etc.) | 9.0 |

Node.js et Express permettent d'exposer une API REST légère et performante, dans le même langage que le front-end, ce qui simplifie le partage de types et de logique de validation entre les deux couches.

Documentation officielle :
- https://nodejs.org/docs
- https://expressjs.com
- https://github.com/auth0/node-jsonwebtoken
- https://github.com/dcodeIO/bcrypt.js
- https://helmetjs.github.io
- https://github.com/express-rate-limit/express-rate-limit
- https://zod.dev

### 2.3 ORM et gestion de la base de données

La base de données de SailingLoc est un **PostgreSQL managé par Supabase**. Contrairement à un ORM classique (Doctrine, Prisma), l'accès aux données se fait via le **SDK officiel `@supabase/supabase-js` (v2)**, qui s'appuie sur **PostgREST** : chaque table est exposée comme une ressource interrogeable par un query builder JavaScript typé (`.from('table').select().eq().single()`, etc.), avec possibilité d'activer la **Row Level Security (RLS)** de PostgreSQL pour des règles d'accès au niveau ligne.

La base contient **13 tables** :

`users`, `refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`, `boats`, `availabilities`, `seasonal_prices`, `bookings`, `reviews`, `messages`, `favorites`, `notifications`, `reports`.

Le schéma est versionné dans le dépôt via un script SQL de migration (`backend/supabase_migration.sql`), appliqué manuellement dans l'éditeur SQL de Supabase ou via `npm run db:migrate`.

Documentation officielle :
- https://supabase.com/docs
- https://postgrest.org
- https://www.postgresql.org/docs

### 2.4 Services et API externes

| Service | Usage |
|---|---|
| **Stripe** | Paiements en ligne, cautions, remboursements, webhooks de confirmation |
| **Cloudinary** | Stockage et redimensionnement des photos de bateaux et documents (permis, assurances, KYC) |
| **Resend** (avec repli SMTP/nodemailer) | Envoi des emails transactionnels (confirmation de compte, réservation, contact) |
| **Web Push (VAPID)** | Notifications navigateur (nouvelles réservations, messages) |
| **Pexels API** | Alimentation des visuels de démonstration (scripts de seed) |

Documentation officielle :
- https://stripe.com/docs
- https://cloudinary.com/documentation
- https://resend.com/docs
- https://web.dev/push-notifications-overview

---

## 3. Documentation chaîne de développement front-end

### 3.1 Architecture du projet frontend

Le code source du front-end (`frontend/src`) est organisé comme suit :

- **`components/`** : composants UI réutilisables, regroupés par domaine métier (`boats/`, `bookings/`, `home/`, `layout/`, `notifications/`, `owner/`, `payments/`, `testimonials/`, `ui/` pour les éléments génériques comme boutons, modales, champs de formulaire).
- **`pages/`** : pages associées aux routes de l'application (`auth/`, `dashboard/`, `owner/`, `admin/`, `legal/`).
- **`api/`** : modules dédiés aux appels HTTP vers le back-end (un fichier par domaine : `boats.api.ts`, `bookings.api.ts`, `auth.api.ts`, `users.api.ts`, `reviews.api.ts`, `messages.api.ts`, `kyc.api.ts`, `stripe.api.ts`, etc.), construits au-dessus du client Axios centralisé (`lib/axios.ts`).
- **`store/`** : état global applicatif géré avec Zustand (`auth.store.ts` pour la session utilisateur, `compare.store.ts` pour le comparateur de bateaux, `preferences.store.ts` pour les préférences d'affichage).
- **`hooks/`** : hooks personnalisés (`useFavoriteBoat`, `useNotificationPrefs`, `useProfileCompletion`, `usePushNotifications`, `useSavedSearches`, `useTheme`, `usePageTitle`).
- **`lib/`** : fonctions utilitaires transverses (client Axios, recherche/filtrage de bateaux, génération de facture PDF, export CSV, typographie, helpers génériques).
- **`i18n/`** : configuration i18next et fichiers de traduction FR/EN.
- **`data/`** : jeux de données statiques (destinations, témoignages, images de démonstration).
- **`types/`** : définitions TypeScript partagées.
- **`assets/`** (dans `public/`) : images, icônes, logo, ressources statiques.

### 3.2 Modèle de conception utilisé

Le frontend repose sur une séparation claire des responsabilités, proche d'un modèle **composant/service** adapté à React : les pages et composants gèrent l'affichage, les modules `api/` gèrent la communication avec l'API REST via Axios, TanStack Query gère le cache et la synchronisation des données serveur, et Zustand centralise l'état global côté client (authentification, préférences). Cette organisation limite le couplage entre affichage et logique métier, facilite les tests et la réutilisation, et rend le projet plus lisible pour un travail à plusieurs développeurs.

### 3.3 Normes de codage et bonnes pratiques

Conventions de nommage :
- Composants en **PascalCase** (`BoatCard.tsx`, `BookingForm.tsx`)
- Fonctions et variables en **camelCase** (`handleSubmit`, `currentUser`)
- Hooks personnalisés préfixés `use` (`useFavoriteBoat.ts`)
- Modules API suffixés `.api.ts` (`boats.api.ts`)
- Stores Zustand suffixés `.store.ts` (`auth.store.ts`)
- Constantes globales en `UPPER_CASE` si nécessaire

Le code est entièrement typé en TypeScript (compilation stricte via `tsc` avant le build Vite), ce qui supprime une classe entière d'erreurs à l'exécution. Les composants volumineux sont découpés en sous-composants, la logique métier est extraite des composants de rendu vers les hooks et modules `lib/`/`api/`, et les imports suivent un ordre constant (bibliothèques externes → composants internes → hooks/store → api/lib → styles).

### 3.4 Application des principes SOLID

- **Single Responsibility** : un composant = une responsabilité (ex. `BoatCard` affiche une annonce, il ne gère pas la logique de réservation).
- **Open/Closed** : les composants de `components/ui/` sont paramétrables par props plutôt que dupliqués.
- **Liskov Substitution** : les variantes de composants (ex. cartes de bateaux en mode liste/grille) restent interchangeables sans casser le rendu parent.
- **Interface Segregation** : les props transmises à un composant se limitent à ce qui est réellement utilisé.
- **Dependency Inversion** : les composants dépendent des modules `api/` (abstraction) et non d'appels Axios directs dispersés dans l'interface.

### 3.5 Gestion des commentaires et documentation du code

Les commentaires sont réservés aux cas où la logique n'est pas évidente à la lecture (règle métier, contournement technique, contrainte externe). La documentation des fonctions utilitaires suit une approche inspirée de **JSDoc** :

```ts
/**
 * Calcule le prix total d'une réservation selon le tarif journalier et la durée.
 * @param dailyRate Tarif journalier du bateau
 * @param totalDays Nombre total de jours réservés
 * @returns Prix total de la réservation
 */
function calculateBookingTotal(dailyRate: number, totalDays: number): number {
  return dailyRate * totalDays
}
```

---

## 4. Compatibilité navigateurs

L'application SailingLoc est une application web moderne construite avec React 18, TypeScript, Vite 5 et intégrant une Progressive Web App (service worker via `vite-plugin-pwa`). Elle s'appuie sur des API JavaScript récentes (fetch, Promises, ES2020, Service Worker API pour l'installation et le mode hors-ligne partiel).

### Navigateurs supportés

| Navigateur | Version minimale |
|---|---|
| Google Chrome (desktop) | 100+ |
| Mozilla Firefox | 100+ |
| Microsoft Edge | 100+ |
| Safari (macOS) | 15+ |
| Safari (iOS) | 15+ |
| Chrome Android | 100+ |
| Samsung Internet | 17+ |

### Navigateurs non supportés

- Internet Explorer (toutes versions) — incompatible avec l'architecture ES2020/SPA et le service worker.
- Safari iOS < 14 — support incomplet des API modernes de sécurité.
- Opera Mini — moteur de rendu limité, pas de support Service Worker.
- Navigateurs Android antérieurs à Chrome 80.

### Justification technique

- **JWT / API REST** : nécessite `fetch`, `Promise`, `localStorage`/mémoire sécurisés et le support CORS moderne.
- **Stripe.js** : exige un navigateur compatible ECMAScript 2018+.
- **Service Worker (PWA)** : nécessite HTTPS et un navigateur supportant l'API Service Worker (indisponible sur IE et les très anciens navigateurs mobiles).
- **Sécurité (Helmet, CORS, TLS)** : dépend de standards récents (TLS 1.2+, en-têtes `Content-Security-Policy`, `Strict-Transport-Security`).

La plateforme cible ainsi plus de 97 % des navigateurs réellement utilisés par les utilisateurs finaux, en cohérence avec les exigences des services tiers intégrés (Stripe, Supabase, Cloudinary).

---

## 5. Compte GIT

Le projet SailingLoc utilise **Git** comme système de gestion de versions, hébergé sur **GitHub**, afin de suivre l'évolution du code, faciliter la collaboration entre les trois développeurs de l'équipe et conserver un historique complet des modifications.

L'utilisation d'un système de versionning présente plusieurs avantages : suivi précis des modifications, travail collaboratif simplifié, possibilité de revenir à une version antérieure en cas d'erreur, gestion structurée des évolutions, amélioration de la qualité du code grâce aux revues de pull request.

**Dépôt du projet** (monorepo, frontend et backend dans le même repository) :
https://github.com/Netizor/Sailingloc

### Workflow Git utilisé

- **`main`** : branche stable, contenant le code validé et déployé sur l'environnement de démonstration (VPS OVH).
- **`dev`** : branche d'intégration, où les fonctionnalités développées sont regroupées et testées ensemble avant merge vers `main`.
- **Branches `feat/*`** : une branche par fonctionnalité ou par contributeur, créée à partir de `dev`. Exemples réellement utilisés sur le projet : `feat/user-management`, `feat/role-management`, `feat/booking-management`, `feat/availability`, `feat/document-upload`, `feat/message`, `feat/review`, ainsi que des branches nominatives par développeur (`feat/siapri`, `feat/samiya`, `feat/cheickne`) pour les phases de travail individuel.

Chaque fonctionnalité fait l'objet d'une **pull request** vers `dev` avant fusion, ce qui permet une revue de code, la détection d'erreurs et une discussion sur les choix d'implémentation avant intégration. Le dépôt intègre en complément un **workflow GitHub Actions dédié à la revue de code assistée par IA** (`@claude` invoqué en commentaire de pull request), qui vient compléter la revue humaine sur les points de style, de sécurité et de cohérence (détaillé en section 12).

### Convention de commit

- `feat` : ajout d'une nouvelle fonctionnalité
- `fix` : correction d'un bug
- `refactor` : amélioration du code sans changement fonctionnel
- `docs` : mise à jour de la documentation
- `test` : ajout ou modification de tests

---

## 6. Gestion des tickets

Le suivi des tâches, bugs et évolutions du projet SailingLoc est assuré via **GitHub Issues**, en complément direct du dépôt de code, et organisé visuellement via **GitHub Projects** (vue kanban liée aux Issues du dépôt `Netizor/Sailingloc`).

Ce choix a été privilégié à un outil externe (Jira, Trello) car il conserve le lien direct entre une tâche, la ou les pull requests qui la résolvent et les commits associés — un ticket GitHub Issue peut être fermé automatiquement par la fusion d'une pull request qui le référence (`Closes #12`), ce qui évite la duplication d'information entre deux outils distincts.

### Organisation du suivi

| Colonne / Label | Rôle |
|---|---|
| `backlog` | Tâches identifiées, non encore planifiées |
| `to do` | Tâches planifiées pour le sprint en cours |
| `in progress` | Tâches en cours de développement |
| `in review` | Pull request ouverte, en attente de revue |
| `done` | Tâche validée et fusionnée |

### Types de tickets (labels)

- **feature** : nouvelle fonctionnalité (ex. gestion des disponibilités, messagerie)
- **bug** : anomalie à corriger
- **enhancement** : amélioration d'une fonctionnalité existante
- **documentation** : mise à jour de la documentation technique

Cette organisation permet de garder une vision claire de l'avancement du projet directement au même endroit que le code, facilitant la priorisation et le suivi pour une équipe de trois développeurs.

---

## 7. Tests applicatifs

### Objectifs et outils

Les tests applicatifs garantissent la fiabilité et la non-régression de la plateforme. Deux catégories sont mises en place : les **tests unitaires** côté back-end, et les **tests fonctionnels (end-to-end)** couvrant les parcours utilisateurs critiques sur l'ensemble de l'application.

- **Tests unitaires (back-end)** : réalisés avec le **test runner natif de Node.js** (`node --test`), sans dépendance externe, avec couverture de code générée nativement (`node --test --experimental-test-coverage`).
- **Tests fonctionnels (front-end, end-to-end)** : réalisés avec **Playwright** (`@playwright/test`), qui pilote un vrai navigateur pour simuler les parcours utilisateurs de bout en bout (interface + appels API réels).

### Stratégie de tests unitaires

Modules actuellement couverts (`backend/test/`) — helpers / logique métier pure extraite des routes, mesurée via `npm run test:coverage` :

| Fichier testé | Couverture mesurée (lignes) | Fichiers de test |
|---|---|---|
| `lib/jwt.js` | 100 % | `jwt.test.js` |
| `middleware/auth.middleware.js` | ~97,5 % | `auth.middleware.test.js` |
| `services/email.service.js` | 100 % | `email.service.test.js` |
| `services/notifications.service.js` | 100 % | `notifications.service.test.js` |
| `routes/auth.routes.js` (validation, tokens, RGPD, HIBP) | ~44 % | `auth.validation.test.js`, `auth.security.test.js` |
| `routes/bookings.routes.js` (prix, remboursement, permis, paiement, revenus, handlers HTTP) | ~46 %+ | `bookings.pricing.test.js`, `bookings.rules.test.js`, `bookings.handlers.test.js` |
| `routes/boats.routes.js` (recherche, droits, création, docs) | ~43 % | `boats.routes.test.js` |
| `routes/kyc.routes.js` (statut, revue admin, renouvellement) | ~44 % | `kyc.routes.test.js` |
| `routes/users.routes.js` (profil, mot de passe, rôle) | ~35 % | `users.routes.test.js` |
| `routes/misc.routes.js` (health/SEO, contact, messages, dispo, admin, handlers) | en hausse | `health-seo.test.js`, `misc.helpers.test.js`, `misc.handlers.test.js` |

**Objectif de couverture** : 70 % minimum sur la logique métier critique (authentification, réservation, paiement).

**État actuel** : les briques transverses (JWT, middleware auth, emails, notifications) sont couvertes à ~100 %. Les routes métier prioritaires du CDC (`auth`, `bookings`, `boats`, `users`, `kyc`) ont des **tests unitaires sur la logique pure** (validation, pricing, règles de statut/paiement/permis, KYC, profil). La couverture « lignes » globale des fichiers routes reste inférieure à 70 % car les handlers HTTP (I/O Supabase, Stripe, Cloudinary, multer) ne sont pas encore exercés de bout en bout — axe de la prochaine itération (tests d'intégration des handlers avec mocks).

Rapport de couverture généré via :
```bash
npm run test:coverage
```
(script défini dans `backend/package.json`), consultable en local dans le terminal ; son intégration en CI (GitHub Actions) fait partie des évolutions prévues.

### Stratégie de tests fonctionnels

Les scénarios suivants sont couverts par la suite Playwright (`frontend/e2e/`) :

- **Authentification** (`auth.spec.ts`) : connexion valide/invalide, accès à une route protégée sans être connecté, accès à une route admin sans droit, lien vers l'inscription, validation de formulaire.
- **Espace administrateur** (`admin.spec.ts`) : accès au dashboard, liste des utilisateurs/bateaux/réservations, page de signalements, KPIs, gestion des avis, contrôle d'accès (un locataire ou un propriétaire ne peut pas accéder au dashboard admin).
- **Espace propriétaire** (`owner.spec.ts`) : accès au dashboard, liste des bateaux du propriétaire, création d'annonce, page des revenus, réservations reçues, gestion des disponibilités.
- **Recherche et réservation** (`search-booking.spec.ts`) : chargement de la liste des bateaux, recherche par localisation, affichage carte, navigation vers une fiche bateau, accès au formulaire de réservation (avec/sans connexion), consultation des réservations du locataire.

Les sessions authentifiées pour les trois rôles (admin, propriétaire, locataire) sont pré-établies via `auth.setup.ts` et persistées (`frontend/.auth/admin.json`, `owner.json`, `renter.json`), ce qui évite de repasser par le formulaire de connexion à chaque test et accélère l'exécution de la suite.

Commandes :
```bash
npm run test:e2e         # exécution headless
npm run test:e2e:ui      # mode interactif
npm run test:e2e:report  # rapport HTML des résultats
```

---

## 8. Tests de montée en charge

### Objectif et outils

Les tests de montée en charge permettent de vérifier la capacité de l'API SailingLoc à supporter plusieurs utilisateurs simultanés tout en conservant des performances acceptables, et d'identifier les limites du système avant mise en production.

Ces tests sont réalisés avec **k6** (Grafana k6), un outil de test de charge scriptable en JavaScript, particulièrement adapté à une API REST comme celle de SailingLoc puisqu'il permet d'écrire les scénarios dans le même langage que le reste du projet.

Documentation officielle : https://k6.io/docs

### Scénarios de tests mis en place

Quatre scripts sont définis dans `backend/load-tests/` :

| Script | Endpoint testé | Seuils (thresholds) |
|---|---|---|
| `health.js` | `GET /api/health` | Taux d'erreur < 1 %, P95 < 1000 ms |
| `boats-list.js` | `GET /api/boats` | Taux d'erreur < 1 %, P95 < 2000 ms |
| `boat-detail.js` | `GET /api/boats/:id` | Taux d'erreur < 1 %, P95 < 2000 ms |
| `user-journey.js` | Parcours multi-étapes : liste des bateaux → détail d'un bateau | Taux d'erreur < 1 %, P95 < 2000 ms |

Chaque script suit une montée progressive : 10 s de montée à 5 utilisateurs virtuels, 20 s de palier stable, 10 s de descente. Cette configuration constitue une **première validation de charge légère** ; elle sera étendue selon les trois scénarios attendus pour une couverture complète :

1. **Montée progressive** : paliers à 10, 50, 100 puis 200 utilisateurs virtuels, pour identifier le point de dégradation des performances.
2. **Test de pointe (stress test)** : simulation d'un pic de charge court (ex. affluence estivale) sur les parcours de recherche, réservation et paiement.
3. **Test de seuil critique** : montée jusqu'à saturation pour déterminer la capacité maximale supportée par le VPS OVH avant instabilité.

### Indicateurs de performance mesurés

- Temps de réponse moyen et P95
- Taux d'erreur HTTP
- Nombre de requêtes par seconde (débit)
- Utilisation CPU / mémoire du VPS pendant le test
- Nombre maximal d'utilisateurs simultanés supportés avant dégradation

### Exécution

```bash
k6 run load-tests/health.js
k6 run load-tests/boats-list.js
k6 run load-tests/boat-detail.js
BASE_URL=https://dsp-dev-o24a-g4.cloud k6 run load-tests/user-journey.js
```

La variable `BASE_URL` permet de rejouer les scénarios aussi bien en local qu'en conditions réelles contre l'environnement de démonstration hébergé sur OVH.

### Analyse et axes d'amélioration

Les points les plus sensibles à surveiller en priorité sont les endpoints impliquant une écriture en base (création de réservation, paiement Stripe) et la recherche de bateaux avec filtres (requêtes potentiellement coûteuses côté Supabase). En cas de dégradation constatée, les leviers envisagés sont : l'ajout d'index sur les colonnes de recherche fréquentes (localisation, dates, type de bateau), la mise en cache des résultats de recherche côté API, l'augmentation des ressources du VPS (vCPU/RAM), et, à terme, la bascule vers une offre Supabase avec davantage de ressources dédiées.

---

## 9. Procédures de sécurisation

### 9.1 HTTPS

L'ensemble des échanges entre le navigateur et le serveur transitent en HTTPS. Sur le VPS OVH, la terminaison SSL est assurée par **Nginx** avec un certificat **Let's Encrypt** (renouvellement automatique via `certbot`), ce qui chiffre les données en transit et protège contre les attaques de type Man-in-the-Middle.

### 9.2 Protection contre les injections SQL

L'accès à la base de données ne passe jamais par des requêtes SQL concaténées manuellement : toutes les requêtes transitent par le SDK **`@supabase/supabase-js`**, qui construit des requêtes paramétrées via PostgREST. Les entrées utilisateurs sont en complément validées côté API avec **Zod** avant tout accès en base, ce qui filtre les types et formats attendus.

### 9.3 Protection contre les attaques XSS

L'API ne renvoie que du JSON (aucun HTML généré côté serveur), ce qui limite fortement le risque de XSS côté back-end. Côté front, React échappe par défaut tout contenu inséré dans le DOM (pas d'usage de `dangerouslySetInnerHTML` sur du contenu utilisateur non filtré), et **Helmet** ajoute des en-têtes de sécurité (dont Content-Security-Policy) sur les réponses de l'API.

### 9.4 Protection contre les attaques CSRF

L'authentification repose exclusivement sur un **token JWT transmis dans l'en-tête `Authorization: Bearer`**, sans cookie de session. Cette architecture stateless supprime la surface d'attaque CSRF classique, qui exploite l'envoi automatique de cookies par le navigateur.

### 9.5 Contrôle des cookies

Aucun cookie n'est utilisé pour l'authentification de l'API (ni côté client, ni côté serveur) : le token d'accès est géré côté client par l'application React (store Zustand), et transmis explicitement à chaque appel via l'intercepteur Axios. Cela simplifie la surface de sécurité liée aux cookies (pas d'attribut `Secure`/`HttpOnly`/`SameSite` à gérer côté API) et facilite par ailleurs la consommation de l'API par une future application mobile, qui ne dispose pas nativement d'un magasin de cookies partagé avec le navigateur.

### 9.6 JWT Tokens

- **Access token** : signé en **HS256** avec un secret partagé (`JWT_SECRET`, chaîne aléatoire ≥ 32 caractères, définie en variable d'environnement), durée de vie **15 minutes**.
- **Refresh token** : token **opaque (UUID v4)**, non signé, stocké côté serveur dans la table `refresh_tokens`, durée de vie **7 jours**. Étant opaque et stocké en base, il peut être révoqué immédiatement (déconnexion, changement de mot de passe, suppression de compte), contrairement à un JWT auto-porteur qui reste valide jusqu'à expiration même après révocation côté serveur.

Génération/validation implémentées dans `backend/src/lib/jwt.js` (`signAccessToken`, `verifyAccessToken`, `generateRefreshToken`), testées unitairement (100 % de couverture).

### 9.7 Contrôle d'accès aux API

L'accès aux ressources est contrôlé par un système de rôles vérifié dans `backend/src/middleware/auth.middleware.js` :

| Rôle | Droits |
|---|---|
| Visiteur (non authentifié) | Consultation publique uniquement (annonces, disponibilités) |
| `RENTER` | Réservation, paiement, messagerie, avis, favoris |
| `OWNER` | Gestion de ses bateaux, disponibilités, suivi des revenus |
| `ADMIN` | Administration complète (utilisateurs, annonces, réservations, signalements) |

Le middleware `authenticate` vérifie le token, recharge l'utilisateur depuis Supabase et bloque l'accès si le compte est marqué `is_blocked`. Le middleware `requireRole(...roles)` restreint ensuite l'accès à un ou plusieurs rôles selon l'endpoint.

### 9.8 Protection anti-brute-force et limitation de débit

La bibliothèque **`express-rate-limit`** est appliquée sur les routes sensibles :

| Route | Limite |
|---|---|
| Connexion (`/api/auth/login`) | 20 tentatives / 15 minutes |
| Inscription (`/api/auth/register`) | 5 tentatives / heure |
| Réinitialisation de mot de passe | 5 tentatives / heure |

### 9.9 Sécurisation des mots de passe

Les mots de passe sont hachés avec **bcryptjs**, coût **12** (soit 2¹² = 4096 itérations par hachage), ce qui rend les attaques par force brute ou par dictionnaire coûteuses en ressources pour un attaquant disposant d'un dump de la base.

L'ensemble de ces procédures — HTTPS, absence de cookies pour l'auth, JWT à durée courte avec refresh révocable, contrôle de rôle systématique, rate limiting et hachage fort des mots de passe — garantit un niveau de sécurité cohérent avec la sensibilité des données traitées par SailingLoc (identité, permis bateau, paiements).

---

## 10. Maintenance

La maintenance d'une application web est une étape essentielle après sa mise en production. Elle permet de garantir la stabilité, la sécurité et les performances du site sur le long terme.

Dans le cadre du projet SailingLoc, la maintenance représente un enjeu important afin d'assurer la continuité du service et la disponibilité de la plateforme, la protection des données des utilisateurs, ainsi que l'évolution de l'application en fonction des besoins du marché. Elle permet également de maintenir la compatibilité avec les mises à jour des technologies utilisées, à savoir **Node.js, les dépendances npm et la plateforme Supabase** (et non plus Symfony/PHP/MySQL comme dans la version initiale du cahier des charges).

Sans une maintenance régulière, l'application pourrait rapidement devenir obsolète, présenter des failles de sécurité et perdre en performance.

### Types de maintenance

**Maintenance corrective** : elle consiste à corriger les bugs ou dysfonctionnements détectés après la mise en production.
Exemples : erreur lors d'une réservation, problème d'affichage, bug lié au paiement Stripe.

**Maintenance préventive** : elle vise à anticiper les problèmes techniques grâce à des mises à jour régulières.
Exemples : mise à jour des dépendances npm (`npm outdated`, `npm audit` pour détecter les vulnérabilités), suivi des évolutions de l'API Supabase, vérification des performances, surveillance des logs serveur.

**Maintenance évolutive** : elle concerne l'amélioration continue de la plateforme et l'ajout de nouvelles fonctionnalités.
Exemples : ajout de nouvelles options de recherche, amélioration de l'interface utilisateur, ajout de fonctionnalités (application mobile, nouveaux moyens de paiement…).

**Maintenance adaptative** : elle permet d'adapter l'application aux évolutions externes.
Exemples : évolution des réglementations (RGPD), mise à jour de l'API Stripe ou Cloudinary, montée de version de Node.js (suivi des versions LTS), compatibilité avec de nouveaux navigateurs.

### Modalités de maintenance

Afin de garantir un service fiable, plusieurs niveaux d'intervention sont définis :

- **Incident critique** (site indisponible, paiement bloqué) → intervention sous **4 heures**
- **Incident important** (fonctionnalité principale dégradée) → intervention sous **24 heures**
- **Incident mineur** (bug non bloquant) → intervention sous **48 heures**

### Indicateurs de performance (SLA)

- Taux de disponibilité (uptime) : supérieur à **99 %**
- Temps moyen de résolution (MTTR) : inférieur à **24h** pour les incidents majeurs
- Temps de réponse serveur : optimisé (< 500 ms en moyenne)
- Taux d'erreurs applicatives : surveillé en continu

### Responsable de la maintenance

La maintenance du projet SailingLoc sera supervisée par **Siapri Mariam Ouattara**, cheffe de projet chez Pandawan, en charge de la gestion des incidents, de la coordination technique, du suivi des performances et de la communication avec le client.

### Budget estimé

La maintenance est proposée sous forme de prestation optionnelle après la mise en production.

**Tarif : 350 € par mois, soit 4 200 € par an.**

Cette prestation comprend la correction des bugs, les mises à jour techniques (dépendances npm, Supabase, services tiers), le support technique et le suivi des performances.

La mise en place d'une maintenance structurée permet à SailingLoc de garantir une plateforme fiable, sécurisée et évolutive, et constitue un élément clé pour assurer la satisfaction des utilisateurs et la pérennité du projet.

---

## 11. Mise en ligne

### 11.1 Types d'hébergement

- **Mutualisé** : peu coûteux, mais ressources partagées et peu adapté à une API dynamique avec base de données et paiements.
- **Dédié** : performances élevées et contrôle total, mais coût important et maintenance complexe.
- **VPS** : bon compromis coût/performance, ressources dédiées (CPU, RAM), adapté à une architecture API + SPA, nécessite un minimum de compétences système.
- **Cloud (AWS, GCP...)** : scalabilité et disponibilité élevées, infrastructure flexible, mais coût et configuration plus complexes à maîtriser pour une petite équipe.

### 11.2 Comparaison des hébergeurs (recommandation pour le client)

| Hébergeur | Points forts | Tarif indicatif |
|---|---|---|
| **OVHcloud** | VPS performant, hébergement en Europe (conformité RGPD facilitée), bon rapport qualité/prix | ~10 à 20 €/mois |
| **IONOS** | Offres accessibles, bon support | ~5 à 15 €/mois |
| **AWS** | Infrastructure scalable, services avancés (RDS, autoscaling) | ~20 à 50 €/mois minimum |

### 11.3 Justification du choix d'hébergement

Les scripts de tests de montée en charge (k6, section 8) montrent que l'application doit pouvoir absorber plusieurs utilisateurs simultanés tout en gardant un temps de réponse stable, avec une consommation CPU/mémoire qui augmente avec la charge. Un hébergement mutualisé n'est donc pas adapté. **Un VPS OVH est recommandé au client** : ressources dédiées, bon compromis coût/performance, possibilité de faire évoluer les ressources (CPU/RAM) au fur et à mesure de la croissance de la plateforme.

**Environnement de démonstration du projet** : dans le cadre de la soutenance, le déploiement a été réalisé sur un **VPS OVH**, accessible via le nom de domaine fourni par l'établissement : **`dsp-dev-o24a-g4.cloud`**. Nginx y sert le build de production du front React et fait office de reverse proxy HTTPS vers l'API Node.js/Express.

### 11.4 Scalabilité et évolution

Plusieurs leviers permettent d'anticiper la croissance : augmentation progressive des ressources du VPS (CPU/RAM), montée en gamme de l'offre Supabase (plus de connexions simultanées, réplication), mise en cache des requêtes de recherche côté API, et, si le trafic le justifie, migration vers une infrastructure cloud avec répartition de charge (load balancing).

### 11.5 Configuration recommandée

- 2 vCPU
- 4 Go RAM
- 80 Go SSD
- Ubuntu 22.04 LTS
- Nginx + Node.js 20 LTS

Coût annuel estimé (hébergement + nom de domaine) : environ **150 à 250 €**.

### 11.6 Nom de domaine

Pour l'exploitation commerciale, les noms de domaine recommandés au client sont **sailingloc.com** et **sailingloc.fr** (simples, mémorisables, cohérents avec l'identité de marque).

Pour l'environnement de démonstration du projet (soutenance), le nom de domaine utilisé est **dsp-dev-o24a-g4.cloud**, fourni dans le cadre du cursus et pointé vers le VPS OVH via un enregistrement DNS de type A.

### 11.7 Manuel de déploiement

**1. Prérequis**
- VPS OVH (Ubuntu 22.04)
- Accès SSH
- Node.js ≥ 20 + npm
- Nginx
- Compte Supabase configuré (URL + clé de service)
- Compte Stripe, Cloudinary, Resend configurés

**2. Préparation de l'environnement**
- Connexion SSH au VPS
- Installation de Node.js 20 LTS, Nginx, et d'un gestionnaire de processus (PM2 recommandé pour superviser le processus Node.js : redémarrage automatique en cas de crash, démarrage au boot)
- Configuration des variables d'environnement backend (`.env` à partir de `.env.example` : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDINARY_*`, `RESEND_API_KEY`, `FRONTEND_URL`)
- La base de données n'est **pas installée sur le VPS** : le schéma est appliqué directement sur le projet Supabase distant via `supabase_migration.sql`

**3. Déploiement backend (Node.js/Express)**
```bash
git clone git@github.com:Netizor/Sailingloc.git
cd Sailingloc/backend
npm install
cp .env.example .env   # puis renseigner les valeurs de production
npm run start          # ou: pm2 start src/index.js --name sailingloc-api
```

**4. Déploiement frontend (React)**
```bash
cd ../frontend
npm install
cp .env.example .env   # VITE_API_URL, VITE_STRIPE_PUBLIC_KEY
npm run build          # génère le dossier dist/
```
Le contenu de `dist/` est servi statiquement par Nginx.

**5. Configuration Nginx**
- Bloc `server` servant `dist/` sur `/`
- Bloc `location /api/` avec `proxy_pass http://127.0.0.1:4000;` vers l'API Node.js
- Activation HTTPS (voir étape 7)

**6. Configuration DNS**
- Enregistrement de type **A** pointant `dsp-dev-o24a-g4.cloud` vers l'IP publique du VPS OVH

**7. Sécurisation**
- Certificat SSL via **Let's Encrypt** (`certbot --nginx`)
- Redirection HTTP → HTTPS obligatoire
- Pare-feu limité aux ports 22 (SSH), 80 (HTTP) et 443 (HTTPS)
- Webhook Stripe configuré avec l'URL de production et vérification de signature (`STRIPE_WEBHOOK_SECRET`)

**8. Tests après déploiement**
- Vérification des parcours critiques (connexion, recherche, réservation, paiement test Stripe)
- Rejeu des scénarios k6 avec `BASE_URL=https://dsp-dev-o24a-g4.cloud`
- Vérification des en-têtes de sécurité (Helmet) et du certificat SSL
- Test sur mobile et vérification du comportement PWA (installation, service worker)

**9. Backups et restauration**
- Sauvegardes automatiques de la base gérées par Supabase (rétention selon l'offre souscrite)
- Sauvegarde des variables d'environnement et de la configuration Nginx en dehors du VPS
- Plan de restauration : redéploiement du code depuis GitHub (`main`) + reconnexion au projet Supabase existant (les données ne sont pas perdues en cas de panne du VPS, puisqu'elles sont hébergées séparément)

---

## 12. Software et outils

### 12.1 Gestion de projet

- **GitHub Issues / GitHub Projects** : suivi des tâches, bugs et évolutions, directement lié au code et aux pull requests (voir section 6).
- **MS Project / GanttProject** : élaboration du diagramme de Gantt et du planning global du projet.

### 12.2 Outils de conception graphique

- **Figma** : maquettage de l'interface, prototypage des écrans, définition de l'expérience utilisateur (UX).

### 12.3 Outils de développement

- **Visual Studio Code** : éditeur principal, avec extensions ESLint et Prettier pour la cohérence et le formatage du code TypeScript/JavaScript.
- **GitHub** : hébergement du dépôt, gestion des branches et des pull requests.
- **Postman** : test manuel des endpoints de l'API REST pendant le développement.
- **k6** : tests de montée en charge (voir section 8).
- **Playwright** : tests fonctionnels end-to-end (voir section 7).

### 12.4 Outils d'intelligence artificielle

**Claude** (Anthropic) a été utilisé tout au long du projet, à deux niveaux :

1. **En assistance de développement** : compréhension de concepts techniques, pistes d'architecture, aide à la rédaction et à la relecture de code, structuration du backend Node/Express, renforcement des bonnes pratiques de sécurité (JWT, RGPD), et aide à la rédaction de la documentation technique et du cahier des charges.
2. **En intégration continue** : le dépôt GitHub intègre un workflow **GitHub Actions dédié à la revue de code assistée par IA** (`.github/workflows/claude-code-review.yml` et `claude.yml`), déclenché automatiquement sur les pull requests ou sur mention `@claude` dans un commentaire/issue. Cela permet d'obtenir une première revue automatisée (cohérence, sécurité, style) en complément de la revue humaine entre les trois développeurs, avant la fusion vers `dev`.

L'utilisation combinée de ces outils a permis de structurer efficacement le projet SailingLoc, d'accélérer certaines phases de développement et de renforcer la qualité du code produit dans une équipe réduite.
