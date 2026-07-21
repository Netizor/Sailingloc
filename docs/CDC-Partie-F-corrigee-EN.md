# F. Detailed Technical Specification Document (English Version)

## 1. Global Project Architecture

### Overview of main architectures

**MERN** (MongoDB, Express, React, Node.js) is a full JavaScript stack, simplifying development by using the same language on frontend and backend. Well suited to fast, modern applications, less suited to highly relational data.

**MEAN** (MongoDB, Express, Angular, Node.js) follows the same principle but uses Angular, which is more structured and better suited to large teams and enterprise projects.

**SEAN** (SQL, Express, Angular, Node.js) is similar to MEAN but uses a relational database, more suitable for applications requiring strong data relationships.

**MSSR** (MySQL, Symfony, SQL, React) is a PHP-oriented stack with Symfony as the main framework, a relational MySQL database and React on the frontend.

**MSAA** (Microservices, SQL, API, Angular) splits the application into independent services communicating via APIs. Highly scalable but significantly more complex to implement and maintain.

**PSAA** (Python, SQL, API, Angular) uses Python on the backend (Django/FastAPI), a SQL database and Angular on the frontend. Popular for projects involving AI or data processing.

**PERN** (PostgreSQL, Express, React, Node.js) is a full JavaScript application stack (Node.js/Express/React) backed by a relational PostgreSQL database. It combines the development speed of a unified JavaScript stack with the robustness of a relational database, which makes it well suited to transactional applications with strongly relational data (bookings, users, payments).

### Architecture comparison

| Criterion | MERN | MEAN | SEAN | MSSR | MSAA | PSAA | PERN |
|---|---|---|---|---|---|---|---|
| Database | NoSQL | NoSQL | SQL | SQL | SQL | SQL | SQL |
| Backend | Node.js | Node.js | Node.js | Symfony/PHP | Microservices | Python | Node.js |
| Frontend | React | Angular | Angular | React | Angular | Angular | React |
| Scalability | Good | Good | Medium | Good | Excellent | Good | Good |
| Complexity | Low | Medium | Medium | Medium | High | Medium | Low |
| Relational data fit | No | No | Yes | Yes | Yes | Yes | Yes |
| Single language front/back | Yes | Yes | Yes | No | No | No | Yes |
| Mobile-ready (REST API) | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

### Selected architecture: PERN + Supabase (BaaS)

SailingLoc was initially scoped around an **MSSR (MySQL + Symfony + React)** architecture. Following the initial scoping phase, the team evolved this choice toward a **PERN architecture (PostgreSQL + Express + React + Node.js)**, with the relational database hosted and managed through **Supabase**, a Backend-as-a-Service platform built on PostgreSQL.

This decision was driven by several factors:

- **Single language across the stack**: the three-person team works in JavaScript/TypeScript on both frontend (React) and backend (Node.js/Express), reducing ramp-up time and simplifying cross-review between team members.
- **Reduced operational overhead**: Supabase provides a managed PostgreSQL database, automated backups, a PostgREST API and fine-grained access control (Row Level Security), avoiding the need to self-manage a MySQL/Doctrine stack and speeding up iteration on a time-constrained student project.
- **Fit for relational data**: SailingLoc's data model (users, boats, bookings, reviews, availability, payments) remains strongly relational; PostgreSQL natively handles these relationships, constraints and transactions.
- **Mobile-readiness**: as with the originally planned architecture, the Node.js/Express backend exposes a decoupled **REST API**, allowing a future mobile application (e.g. React Native) to be connected without reworking the backend.
- **Mature ecosystem**: Express, Supabase and Stripe all have extensive documentation and large communities, limiting the risk of technical dead-ends during development.

SailingLoc therefore adopts a layered client-server architecture, clearly separating the frontend (React), the backend (Node.js/Express exposing a REST API) and the data layer (PostgreSQL managed by Supabase), complemented by external services (Stripe, Cloudinary, Resend, Web Push).

```
Browser (Chrome, Firefox, Safari, Edge)
        │  HTTPS (443)
        ▼
Nginx (reverse proxy, OVH VPS, Let's Encrypt certificate)
   ├── / (static)          → React production build (Vite)
   └── /api (proxy_pass)   → Node.js / Express (internal port, e.g. 4000)
                                   │
                                   ├── Supabase (managed PostgreSQL, hosted off-VPS)
                                   ├── Stripe API (payments)
                                   ├── Cloudinary (image/document storage)
                                   ├── Resend / SMTP (transactional emails)
                                   └── Web Push (VAPID, browser notifications)
```

Unlike the originally documented architecture (database co-located on the same server as the application), **the database is not hosted on the VPS**: it is managed by Supabase as an external managed service, which simplifies maintenance (backups, version upgrades, replication) but introduces a network dependency on a third-party service, accounted for in the risk analysis.

---

## 2. Development Technologies

### 2.1 Frontend Technologies

| Technology | Role | Version |
|---|---|---|
| React | UI library, reusable components, SPA | 18.2 |
| TypeScript | Static typing for frontend code | 5.3 |
| Vite | Bundler / development server | 5.0 |
| React Router | Client-side navigation (SPA, no full reload) | 6.21 |
| TailwindCSS | Utility-first CSS framework | 3.4 |
| Axios | HTTP client for REST API calls | 1.6 |
| TanStack Query (React Query) | Server-state caching and synchronization | 5.17 |
| Zustand | Lightweight client state management (auth, preferences, comparison) | 4.5 |
| react-i18next / i18next | FR/EN internationalization of the UI | 25.x |
| react-helmet-async | SEO meta tag management | 3.0 |
| react-leaflet / Leaflet | Interactive map (ports, boat locations) | 4.2 / 1.9 |
| react-day-picker | Availability and booking calendar | 9.x |
| Recharts | Dashboard charts (revenue, admin KPIs) | 3.x |
| Stripe.js / @stripe/react-stripe-js | Client-side payment integration | 3.x / 2.4 |
| vite-plugin-pwa | Progressive Web App (manifest, service worker, install) | 1.2 |

Official documentation:
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

### 2.2 Backend Technologies

| Technology | Role | Version |
|---|---|---|
| Node.js | Server-side JavaScript runtime | ≥ 20 (LTS) |
| Express | Web framework, REST API exposure | 4.19 |
| jsonwebtoken | JWT generation and verification (access token) | 9.0 |
| bcryptjs | Password hashing | 2.4 |
| helmet | HTTP security headers | 7.1 |
| cors | Cross-origin request control | 2.8 |
| express-rate-limit | Request throttling (anti brute-force) | 7.3 |
| zod | Input data schema validation | 3.23 |
| multer | Multipart upload handling (before forwarding to Cloudinary) | 2.1 |
| uuid | Unique identifier generation (refresh tokens, etc.) | 9.0 |

Node.js and Express provide a lightweight, performant REST API in the same language as the frontend, simplifying the sharing of types and validation logic between the two layers.

Official documentation:
- https://nodejs.org/docs
- https://expressjs.com
- https://github.com/auth0/node-jsonwebtoken
- https://helmetjs.github.io
- https://zod.dev

### 2.3 ORM and Database Management

SailingLoc's database is a **PostgreSQL instance managed by Supabase**. Rather than a classic ORM (Doctrine, Prisma), data access goes through the official **`@supabase/supabase-js` SDK (v2)**, built on top of **PostgREST**: each table is exposed as a queryable resource through a typed JavaScript query builder (`.from('table').select().eq().single()`, etc.), with optional **Row Level Security (RLS)** enforced at the PostgreSQL level.

The database contains **13 tables**:

`users`, `refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`, `boats`, `availabilities`, `seasonal_prices`, `bookings`, `reviews`, `messages`, `favorites`, `notifications`, `reports`.

The schema is version-controlled in the repository via a SQL migration script (`backend/supabase_migration.sql`), applied manually in the Supabase SQL editor or through `npm run db:migrate`.

Official documentation: https://supabase.com/docs | https://postgrest.org | https://www.postgresql.org/docs

### 2.4 External Services and APIs

| Service | Usage |
|---|---|
| **Stripe** | Online payments, deposits, refunds, confirmation webhooks |
| **Cloudinary** | Storage and resizing of boat photos and documents (licenses, insurance, KYC) |
| **Resend** (SMTP/nodemailer fallback) | Transactional emails (account confirmation, booking, contact form) |
| **Web Push (VAPID)** | Browser notifications (new bookings, messages) |
| **Pexels API** | Demo visuals (seed scripts) |

---

## 3. Frontend Development Workflow Documentation

### 3.1 Frontend Architecture

The frontend source (`frontend/src`) is organized as follows:

- **`components/`**: reusable UI elements grouped by domain (`boats/`, `bookings/`, `home/`, `layout/`, `notifications/`, `owner/`, `payments/`, `testimonials/`, `ui/` for generic building blocks such as buttons, modals, form fields).
- **`pages/`**: route-level pages (`auth/`, `dashboard/`, `owner/`, `admin/`, `legal/`).
- **`api/`**: HTTP call modules toward the backend (one file per domain: `boats.api.ts`, `bookings.api.ts`, `auth.api.ts`, `users.api.ts`, `reviews.api.ts`, `messages.api.ts`, `kyc.api.ts`, `stripe.api.ts`, etc.), built on top of the centralized Axios client (`lib/axios.ts`).
- **`store/`**: global application state managed with Zustand (`auth.store.ts` for the user session, `compare.store.ts` for the boat comparison tool, `preferences.store.ts` for display preferences).
- **`hooks/`**: custom hooks (`useFavoriteBoat`, `useNotificationPrefs`, `useProfileCompletion`, `usePushNotifications`, `useSavedSearches`, `useTheme`, `usePageTitle`).
- **`lib/`**: cross-cutting utilities (Axios client, boat search/filtering, PDF invoice generation, CSV export, typography, generic helpers).
- **`i18n/`**: i18next configuration and FR/EN translation files.
- **`data/`**: static datasets (destinations, testimonials, demo images).
- **`types/`**: shared TypeScript type definitions.

### 3.2 Design Pattern

The frontend follows a clear separation of concerns, close to a **component/service** pattern adapted to React: pages and components handle rendering, `api/` modules handle REST API communication via Axios, TanStack Query manages server-state caching and synchronization, and Zustand centralizes client-side global state (authentication, preferences). This reduces coupling between UI and business logic, eases testing and reuse, and keeps the codebase readable for a multi-developer team.

### 3.3 Coding Standards

- Components in **PascalCase** (`BoatCard.tsx`, `BookingForm.tsx`)
- Functions and variables in **camelCase** (`handleSubmit`, `currentUser`)
- Custom hooks prefixed with `use` (`useFavoriteBoat.ts`)
- API modules suffixed `.api.ts` (`boats.api.ts`)
- Zustand stores suffixed `.store.ts` (`auth.store.ts`)
- Global constants in `UPPER_CASE` where relevant

The codebase is fully typed in TypeScript (strict compilation via `tsc` before the Vite build), eliminating an entire class of runtime errors. Large components are split into smaller ones, business logic is extracted from render components into hooks and `lib/`/`api/` modules, and imports follow a consistent order (external libraries → internal components → hooks/store → api/lib → styles).

### 3.4 SOLID Principles

- **Single Responsibility**: one component = one responsibility (e.g. `BoatCard` renders a listing, it does not own booking logic).
- **Open/Closed**: `components/ui/` components are extended through props rather than duplicated.
- **Liskov Substitution**: interchangeable component variants (e.g. list/grid boat cards) don't break the parent's rendering.
- **Interface Segregation**: components only receive the props they actually use.
- **Dependency Inversion**: components depend on `api/` modules (abstraction) rather than scattered direct Axios calls.

### 3.5 Comments and Code Documentation

Comments are reserved for non-obvious logic (business rules, technical workarounds, external constraints). Utility functions follow a **JSDoc-inspired** documentation style:

```ts
/**
 * Calculates the total booking price from the daily rate and duration.
 * @param dailyRate Daily rate of the boat
 * @param totalDays Total number of booked days
 * @returns Total booking price
 */
function calculateBookingTotal(dailyRate: number, totalDays: number): number {
  return dailyRate * totalDays
}
```

---

## 4. Browser Compatibility

SailingLoc is a modern web application built with React 18, TypeScript, Vite 5, and includes a Progressive Web App layer (service worker via `vite-plugin-pwa`). It relies on modern JavaScript APIs (fetch, Promises, ES2020, Service Worker API for install and partial offline support).

### Supported browsers

| Browser | Minimum version |
|---|---|
| Google Chrome (desktop) | 100+ |
| Mozilla Firefox | 100+ |
| Microsoft Edge | 100+ |
| Safari (macOS) | 15+ |
| Safari (iOS) | 15+ |
| Chrome Android | 100+ |
| Samsung Internet | 17+ |

### Unsupported browsers

- Internet Explorer (all versions) — incompatible with the ES2020/SPA architecture and the service worker.
- Safari iOS < 14 — incomplete support of modern security APIs.
- Opera Mini — limited rendering engine, no Service Worker support.
- Android browsers older than Chrome 80.

### Technical justification

- **JWT / REST API**: requires `fetch`, `Promise`, secure client-side storage and modern CORS support.
- **Stripe.js**: requires an ECMAScript 2018+ compatible browser.
- **Service Worker (PWA)**: requires HTTPS and Service Worker API support (unavailable on IE and very old mobile browsers).
- **Security (Helmet, CORS, TLS)**: depends on modern standards (TLS 1.2+, `Content-Security-Policy`, `Strict-Transport-Security` headers).

The platform therefore targets more than 97% of real-world browser usage, consistent with the requirements of the integrated third-party services (Stripe, Supabase, Cloudinary).

---

## 5. Git Account

SailingLoc uses **Git** for version control, hosted on **GitHub**, to track code evolution, ease collaboration between the three developers, and maintain a full history of changes.

**Repository** (monorepo, frontend and backend in the same repository):
https://github.com/Netizor/Sailingloc

### Git workflow

- **`main`**: stable branch, containing validated code deployed on the demo environment (OVH VPS).
- **`dev`**: integration branch, where features are grouped and tested together before merging into `main`.
- **`feat/*` branches**: one branch per feature or contributor, created from `dev`. Real examples used on the project: `feat/user-management`, `feat/role-management`, `feat/booking-management`, `feat/availability`, `feat/document-upload`, `feat/message`, `feat/review`, plus per-developer branches (`feat/siapri`, `feat/samiya`, `feat/cheickne`) for individual work phases.

Every feature goes through a **pull request** into `dev` before merging, enabling code review, error detection and implementation discussions before integration. The repository also includes a **GitHub Actions workflow dedicated to AI-assisted code review** (`@claude` mentioned in a PR comment), complementing human review on style, security and consistency (detailed in section 12).

### Commit convention

- `feat`: new feature
- `fix`: bug fix
- `refactor`: code improvement without functional change
- `docs`: documentation update
- `test`: test addition or modification

---

## 6. Ticket Management

Task, bug and feature tracking for SailingLoc is handled through **GitHub Issues**, directly complementing the code repository, and organized visually via **GitHub Projects** (a kanban view linked to the Issues of the `Netizor/Sailingloc` repository).

This was preferred over an external tool (Jira, Trello) because it keeps a direct link between a task, the pull request(s) resolving it, and the associated commits — a GitHub Issue can be automatically closed by merging a pull request that references it (`Closes #12`), avoiding duplicated information across two separate tools.

### Board organization

| Column / Label | Role |
|---|---|
| `backlog` | Identified but not yet planned tasks |
| `to do` | Tasks scheduled for the current sprint |
| `in progress` | Tasks currently being developed |
| `in review` | Pull request open, awaiting review |
| `done` | Task validated and merged |

### Ticket types (labels)

- **feature**: new functionality (e.g. availability management, messaging)
- **bug**: issue to fix
- **enhancement**: improvement of an existing feature
- **documentation**: technical documentation update

---

## 7. Application Testing

### Objectives and tools

Application testing ensures reliability and prevents regressions. Two categories are implemented: **unit tests** on the backend, and **functional (end-to-end) tests** covering critical user journeys across the whole application.

- **Unit tests (backend)**: run with Node.js's **native test runner** (`node --test`), with no external dependency, and native code coverage (`node --test --experimental-test-coverage`).
- **Functional tests (frontend, end-to-end)**: run with **Playwright** (`@playwright/test`), driving a real browser to simulate complete user journeys (UI + real API calls).

### Unit testing strategy

Modules currently covered (`backend/test/`) — pure business helpers extracted from routes, measured via `npm run test:coverage`:

| Tested file | Measured coverage (lines) | Test files |
|---|---|---|
| `lib/jwt.js` | 100% | `jwt.test.js` |
| `middleware/auth.middleware.js` | ~97.5% | `auth.middleware.test.js` |
| `services/email.service.js` | 100% | `email.service.test.js` |
| `services/notifications.service.js` | 100% | `notifications.service.test.js` |
| `routes/auth.routes.js` (validation, tokens, GDPR, HIBP) | ~44% | `auth.validation.test.js`, `auth.security.test.js` |
| `routes/bookings.routes.js` (pricing, refunds, license, payment, revenues, HTTP handlers) | ~46%+ | `bookings.pricing.test.js`, `bookings.rules.test.js`, `bookings.handlers.test.js` |
| `routes/boats.routes.js` (search, permissions, create, docs) | ~43% | `boats.routes.test.js` |
| `routes/kyc.routes.js` (status, admin review, renewal) | ~44% | `kyc.routes.test.js` |
| `routes/users.routes.js` (profile, password, role) | ~35% | `users.routes.test.js` |
| `routes/misc.routes.js` (health/SEO, contact, messages, availability, admin, handlers) | rising | `health-seo.test.js`, `misc.helpers.test.js`, `misc.handlers.test.js` |

**Coverage target**: minimum 70% on critical business logic (authentication, booking, payment).

**Current status**: cross-cutting building blocks (JWT, auth middleware, emails, notifications) are covered at ~100%. The CDC priority business routes (`auth`, `bookings`, `boats`, `users`, `kyc`) now have **unit tests on pure logic** (validation, pricing, status/payment/license rules, KYC, profile). Overall route-file line coverage remains below 70% because HTTP handlers (Supabase I/O, Stripe, Cloudinary, multer) are not yet exercised end-to-end — that is the next iteration (handler integration tests with mocks).

Coverage report generated via:
```bash
npm run test:coverage
```
(script defined in `backend/package.json`); CI integration (GitHub Actions) is planned as a future improvement.

### Functional testing strategy

The following scenarios are covered by the Playwright suite (`frontend/e2e/`):

- **Authentication** (`auth.spec.ts`): valid/invalid login, protected route access while logged out, admin route access without rights, registration link, client-side form validation.
- **Admin dashboard** (`admin.spec.ts`): dashboard access, user/boat/booking lists, reports page, KPIs, review moderation, access control (a renter or owner cannot access the admin dashboard).
- **Owner dashboard** (`owner.spec.ts`): dashboard access, owner's boat list, listing creation form, revenue page, received bookings, availability management.
- **Search and booking** (`search-booking.spec.ts`): boat listing load, location-based search, map display, navigation to a boat detail page, booking form access (with/without login), renter's booking history.

Authenticated sessions for the three roles (admin, owner, renter) are pre-established via `auth.setup.ts` and persisted (`frontend/.auth/admin.json`, `owner.json`, `renter.json`), avoiding a login step before every test and speeding up the suite.

Commands:
```bash
npm run test:e2e         # headless run
npm run test:e2e:ui      # interactive mode
npm run test:e2e:report  # HTML report
```

---

## 8. Load Testing

### Objective and tools

Load testing verifies the SailingLoc API's ability to handle multiple simultaneous users while maintaining acceptable performance, and identifies system limits before production.

These tests are run with **k6** (Grafana k6), a JavaScript-scriptable load testing tool, well suited to a REST API like SailingLoc's since scenarios are written in the same language as the rest of the project.

Official documentation: https://k6.io/docs

### Test scenarios

Four scripts are defined in `backend/load-tests/`:

| Script | Endpoint under test | Thresholds |
|---|---|---|
| `health.js` | `GET /api/health` | Error rate < 1%, P95 < 1000 ms |
| `boats-list.js` | `GET /api/boats` | Error rate < 1%, P95 < 2000 ms |
| `boat-detail.js` | `GET /api/boats/:id` | Error rate < 1%, P95 < 2000 ms |
| `user-journey.js` | Multi-step journey: boat list → boat detail | Error rate < 1%, P95 < 2000 ms |

Each script follows a gradual ramp: 10s ramping up to 5 virtual users, 20s stable plateau, 10s ramp-down. This is a **first, light-load validation**; it will be extended to the three scenario types expected for full coverage:

1. **Progressive load increase**: stages at 10, 50, 100 then 200 virtual users, to identify the performance degradation point.
2. **Stress test**: short traffic spike simulation (e.g. summer peak) on search, booking and payment flows.
3. **Critical threshold test**: ramping up to saturation to determine the maximum capacity of the OVH VPS before instability.

### Measured performance indicators

- Average and P95 response time
- HTTP error rate
- Requests per second (throughput)
- VPS CPU/memory usage during the test
- Maximum number of concurrent users supported before degradation

### Execution

```bash
k6 run load-tests/health.js
k6 run load-tests/boats-list.js
k6 run load-tests/boat-detail.js
BASE_URL=https://dsp-dev-o24a-g4.cloud k6 run load-tests/user-journey.js
```

### Analysis and improvement areas

The most sensitive points to monitor are endpoints involving database writes (booking creation, Stripe payment) and boat search with filters (potentially costly queries on Supabase). If degradation is observed, the planned levers are: adding indexes on frequently searched columns (location, dates, boat type), caching search results at the API level, increasing VPS resources (vCPU/RAM), and, longer-term, moving to a Supabase plan with more dedicated resources.

---

## 9. Security Procedures

### 9.1 HTTPS

All exchanges between the browser and the server go through HTTPS. On the OVH VPS, SSL termination is handled by **Nginx** with a **Let's Encrypt** certificate (automatic renewal via `certbot`), encrypting data in transit and protecting against Man-in-the-Middle attacks.

### 9.2 SQL injection protection

Database access never goes through manually concatenated SQL: all queries go through the **`@supabase/supabase-js`** SDK, which builds parameterized queries via PostgREST. User input is additionally validated at the API level with **Zod** before any database access, filtering expected types and formats.

### 9.3 XSS protection

The API only returns JSON (no server-rendered HTML), which greatly reduces backend XSS risk. On the frontend, React escapes all content inserted into the DOM by default (no `dangerouslySetInnerHTML` on unsanitized user content), and **Helmet** adds security headers (including Content-Security-Policy) to API responses.

### 9.4 CSRF protection

Authentication relies exclusively on a **JWT sent in the `Authorization: Bearer` header**, with no session cookie. This stateless architecture removes the classic CSRF attack surface, which exploits the browser's automatic sending of cookies.

### 9.5 Cookie control

No cookies are used for API authentication (client or server side): the access token is managed client-side by the React application (Zustand store) and explicitly attached to every call via the Axios interceptor. This simplifies the cookie-related security surface (no `Secure`/`HttpOnly`/`SameSite` attributes to manage on the API) and also eases future consumption of the API by a mobile application, which does not natively share a cookie store with the browser.

### 9.6 JWT Tokens

- **Access token**: signed with **HS256** using a shared secret (`JWT_SECRET`, random string ≥ 32 characters, set as an environment variable), **15-minute** lifetime.
- **Refresh token**: **opaque token (UUID v4)**, unsigned, stored server-side in the `refresh_tokens` table, **7-day** lifetime. Being opaque and database-stored, it can be revoked immediately (logout, password change, account deletion), unlike a self-contained JWT which remains valid until expiry even after server-side revocation.

Implemented in `backend/src/lib/jwt.js` (`signAccessToken`, `verifyAccessToken`, `generateRefreshToken`), unit-tested at 100% coverage.

### 9.7 API access control

Resource access is controlled through a role system checked in `backend/src/middleware/auth.middleware.js`:

| Role | Rights |
|---|---|
| Visitor (unauthenticated) | Public browsing only (listings, availability) |
| `RENTER` | Booking, payment, messaging, reviews, favorites |
| `OWNER` | Managing own boats, availability, revenue tracking |
| `ADMIN` | Full administration (users, listings, bookings, reports) |

The `authenticate` middleware verifies the token, reloads the user from Supabase, and blocks access if the account is flagged `is_blocked`. The `requireRole(...roles)` middleware then restricts access to one or more roles depending on the endpoint.

### 9.8 Brute-force protection and rate limiting

**`express-rate-limit`** is applied on sensitive routes:

| Route | Limit |
|---|---|
| Login (`/api/auth/login`) | 20 attempts / 15 minutes |
| Registration (`/api/auth/register`) | 5 attempts / hour |
| Password reset | 5 attempts / hour |

### 9.9 Password security

Passwords are hashed with **bcryptjs**, cost factor **12** (i.e. 2¹² = 4096 iterations per hash), making brute-force and dictionary attacks computationally expensive for an attacker who obtains a database dump.

Together, these procedures — HTTPS, no auth cookies, short-lived JWTs with revocable refresh tokens, systematic role checks, rate limiting and strong password hashing — provide a security level consistent with the sensitivity of the data SailingLoc handles (identity, boat licenses, payments).

---

## 10. Maintenance

Maintaining a web application is an essential step after it goes into production. It ensures the site's stability, security and performance over the long term.

For SailingLoc, maintenance is a key concern to ensure service continuity and platform availability, protect user data, and evolve the application according to market needs. It also keeps the application compatible with updates to the technologies used — **Node.js, npm dependencies and the Supabase platform** (rather than Symfony/PHP/MySQL as in the initial version of the specification).

Without regular maintenance, the application could quickly become outdated, expose security flaws, and lose performance.

### Maintenance types

**Corrective maintenance**: fixing bugs or malfunctions detected after going live.
Examples: booking error, display issue, Stripe payment bug.

**Preventive maintenance**: anticipating technical issues through regular updates.
Examples: npm dependency updates (`npm outdated`, `npm audit` to detect vulnerabilities), tracking Supabase API changes, performance checks, server log monitoring.

**Evolutive maintenance**: continuous improvement of the platform and addition of new features.
Examples: new search options, UI improvements, new features (mobile app, new payment methods…).

**Adaptive maintenance**: adapting the application to external changes.
Examples: regulatory changes (GDPR), Stripe or Cloudinary API updates, Node.js version upgrades (following LTS releases), compatibility with new browsers.

### Maintenance terms

Several intervention levels are defined to guarantee a reliable service:

- **Critical incident** (site down, payment blocked) → response within **4 hours**
- **Major incident** (core feature degraded) → response within **24 hours**
- **Minor incident** (non-blocking bug) → response within **48 hours**

### Performance indicators (SLA)

- Uptime: above **99%**
- Mean time to resolution (MTTR): under **24h** for major incidents
- Server response time: optimized (< 500 ms on average)
- Application error rate: continuously monitored

### Maintenance owner

SailingLoc's maintenance will be supervised by **Siapri Mariam Ouattara**, project manager at Pandawan, responsible for incident management, technical coordination, performance tracking and client communication.

### Estimated budget

Maintenance is offered as an optional service after go-live.

**Price: €350/month, i.e. €4,200/year.**

This service includes bug fixes, technical updates (npm dependencies, Supabase, third-party services), technical support and performance monitoring.

A structured maintenance plan allows SailingLoc to guarantee a reliable, secure and scalable platform, and is a key element in ensuring user satisfaction and the project's longevity.

---

## 11. Deployment

### 11.1 Hosting types

- **Shared hosting**: cheap, but shared resources, not suited to a dynamic API with a database and payments.
- **Dedicated server**: high performance and full control, but expensive and complex to maintain.
- **VPS**: good cost/performance balance, dedicated resources, well suited to an API + SPA architecture, requires some system administration skills.
- **Cloud (AWS, GCP...)**: high scalability and availability, flexible infrastructure, but more costly and complex to operate for a small team.

### 11.2 Hosting provider comparison (recommendation for the client)

| Provider | Strengths | Indicative price |
|---|---|---|
| **OVHcloud** | Solid VPS performance, EU-based hosting (easier GDPR compliance), good value | ~€10–20/month |
| **IONOS** | Accessible plans, good support | ~€5–15/month |
| **AWS** | Scalable infrastructure, advanced services (RDS, autoscaling) | ~€20–50/month minimum |

### 11.3 Hosting choice justification

The k6 load test scripts (section 8) show that the application must absorb several simultaneous users while keeping stable response times, with CPU/memory usage rising with load. Shared hosting is therefore not adequate. **An OVH VPS is recommended to the client**: dedicated resources, good cost/performance ratio, and the ability to scale resources (CPU/RAM) as the platform grows.

**Project demo environment**: for the purpose of the school defense, deployment was carried out on an **OVH VPS**, accessible through the domain provided by the school: **`dsp-dev-o24a-g4.cloud`**. Nginx serves the React production build there and acts as an HTTPS reverse proxy to the Node.js/Express API.

### 11.4 Scalability and evolution

Several levers support future growth: progressively increasing VPS resources (CPU/RAM), upgrading the Supabase plan (more concurrent connections, replication), caching search queries at the API level, and, if traffic justifies it, migrating to a load-balanced cloud infrastructure.

### 11.5 Recommended configuration

- 2 vCPU
- 4 GB RAM
- 80 GB SSD
- Ubuntu 22.04 LTS
- Nginx + Node.js 20 LTS

Estimated annual cost (hosting + domain): approximately **€150–250**.

### 11.6 Domain name

For commercial operation, the recommended domain names for the client are **sailingloc.com** and **sailingloc.fr** (simple, memorable, consistent with the brand identity).

For the project demo environment (defense), the domain used is **dsp-dev-o24a-g4.cloud**, provided as part of the curriculum and pointed to the OVH VPS via an A DNS record.

### 11.7 Deployment manual

**1. Prerequisites**
- OVH VPS (Ubuntu 22.04)
- SSH access
- Node.js ≥ 20 + npm
- Nginx
- Configured Supabase account (URL + service key)
- Configured Stripe, Cloudinary, Resend accounts

**2. Environment preparation**
- SSH into the VPS
- Install Node.js 20 LTS, Nginx, and a process manager (PM2 recommended: automatic restart on crash, start on boot)
- Configure backend environment variables (`.env` from `.env.example`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDINARY_*`, `RESEND_API_KEY`, `FRONTEND_URL`)
- The database is **not installed on the VPS**: the schema is applied directly to the remote Supabase project via `supabase_migration.sql`

**3. Backend deployment (Node.js/Express)**
```bash
git clone git@github.com:Netizor/Sailingloc.git
cd Sailingloc/backend
npm install
cp .env.example .env   # then fill in production values
npm run start          # or: pm2 start src/index.js --name sailingloc-api
```

**4. Frontend deployment (React)**
```bash
cd ../frontend
npm install
cp .env.example .env   # VITE_API_URL, VITE_STRIPE_PUBLIC_KEY
npm run build           # generates the dist/ folder
```
The contents of `dist/` are served statically by Nginx.

**5. Nginx configuration**
- `server` block serving `dist/` on `/`
- `location /api/` block with `proxy_pass http://127.0.0.1:4000;` to the Node.js API
- HTTPS enabled (see step 7)

**6. DNS configuration**
- **A record** pointing `dsp-dev-o24a-g4.cloud` to the OVH VPS public IP

**7. Security**
- SSL certificate via **Let's Encrypt** (`certbot --nginx`)
- Mandatory HTTP → HTTPS redirect
- Firewall restricted to ports 22 (SSH), 80 (HTTP) and 443 (HTTPS)
- Stripe webhook configured with the production URL and signature verification (`STRIPE_WEBHOOK_SECRET`)

**8. Post-deployment tests**
- Verification of critical journeys (login, search, booking, Stripe test payment)
- Re-running the k6 scenarios with `BASE_URL=https://dsp-dev-o24a-g4.cloud`
- Verification of security headers (Helmet) and the SSL certificate
- Mobile test and PWA behavior check (install, service worker)

**9. Backups and restoration**
- Automated database backups managed by Supabase (retention depending on the subscribed plan)
- Environment variables and Nginx configuration backed up off the VPS
- Recovery plan: redeploy the code from GitHub (`main`) and reconnect to the existing Supabase project (no data loss in case of VPS failure, since data is hosted separately)

---

## 12. Software and Tools

### 12.1 Project management

- **GitHub Issues / GitHub Projects**: task, bug and feature tracking, directly linked to the code and pull requests (see section 6).
- **MS Project / GanttProject**: Gantt chart and overall project planning.

### 12.2 Graphic design tools

- **Figma**: UI mockups, screen prototyping, UX design.

### 12.3 Development tools

- **Visual Studio Code**: main editor, with ESLint and Prettier extensions for TypeScript/JavaScript code consistency and formatting.
- **GitHub**: repository hosting, branch and pull request management.
- **Postman**: manual REST API endpoint testing during development.
- **k6**: load testing (see section 8).
- **Playwright**: end-to-end functional testing (see section 7).

### 12.4 AI tools

**Claude** (Anthropic) was used throughout the project at two levels:

1. **As a development assistant**: understanding technical concepts, architecture guidance, help drafting and reviewing code, structuring the Node/Express backend, reinforcing security best practices (JWT, GDPR), and assisting with technical documentation and the specification document.
2. **In continuous integration**: the GitHub repository includes a **GitHub Actions workflow dedicated to AI-assisted code review** (`.github/workflows/claude-code-review.yml` and `claude.yml`), automatically triggered on pull requests or on an `@claude` mention in a comment/issue. This provides an automated first pass (consistency, security, style) complementing human review among the three developers, before merging into `dev`.

The combined use of these tools helped structure the SailingLoc project efficiently, accelerate certain development phases, and strengthen the quality of the code produced by a small team.
