# SailingLoc — Note force de proposition

## 1. Choix techniques

| Couche | Technologie | Pourquoi |
|--------|-------------|----------|
| Frontend | React 18 + TypeScript + Vite | Écosystème riche, SPA rapide, réutilisable pour une future app mobile (React Native) |
| UI | Tailwind CSS | Responsive rapide, cohérent avec la charte |
| Backend | Node.js + Express | API REST légère, même langage que le front |
| Base de données | Supabase (PostgreSQL) | Auth, stockage, scalabilité sans ops lourdes |
| Paiement | Stripe (mode test / prod) | Standard marché, PCI-DSS délégué |
| Fichiers | Cloudinary | Upload images et documents |
| Hébergement cible | Vercel (front) + Railway/Render (API) | Déploiement simple, coût maîtrisé |

**Anticipation mobile :** API REST JSON + JWT déjà en place. Une app React Native ou Flutter pourra consommer les mêmes endpoints (`/api/auth`, `/api/boats`, `/api/bookings`…).

---

## 2. Estimation budgétaire (année 1 — MVP)

| Poste | Estimation mensuelle | Estimation annuelle |
|-------|---------------------|---------------------|
| Hébergement front (Vercel Pro) | 20 € | 240 € |
| Hébergement API (Railway/Render) | 15–25 € | 180–300 € |
| Supabase Pro (si trafic réel) | 25 € | 300 € |
| Cloudinary | 0–50 € | 0–600 € |
| Stripe | ~1,4 % + 0,25 € / transaction | Variable |
| Nom de domaine + email (Resend) | 10 € | 120 € |
| **Total infra fixe (hors commissions)** | **~70–110 €/mois** | **~840–1 560 €/an** |

**Développement (projet étudiant / MVP) :** livrable actuel = site fonctionnel + admin + paiement test. Phase 2 (Stripe Connect, app mobile, caution en ligne) : budget additionnel estimé **3 000–8 000 €** selon prestataire.

---

## 3. Roadmap proposée

| Phase | Contenu | Délai indicatif |
|-------|---------|-----------------|
| **Phase 1 (actuelle)** | Site web, réservation, paiement Stripe, espaces locataire/propriétaire/admin | Livré |
| **Phase 2** | Stripe Connect (virements propriétaires), KYC renforcé, OpenAPI `/api/v1` | +2–3 mois |
| **Phase 3** | Application mobile (React Native), notifications push natives | +3–4 mois |
| **Phase 4** | Caution en ligne, contrats signés numériquement, assurance partenaire | +2 mois |

---

## 4. Recommandations visuelles

- Charte appliquée : navy `#003366`, bleu `#2563FF`, Inter + Playfair Display
- Maquettes Figma existantes → base pour l’app mobile
- Mode sombre et accessibilité (ARIA, contraste) à poursuivre sur les calendriers et modales

---

## 5. Modèle économique

- Commission plateforme : **10 %** sur le montant location (configurable `STRIPE_PLATFORM_FEE_PERCENT`)
- Pas d’abonnement propriétaire en phase 1 (acquisition)
- Revenus = volume de réservations × commission

---

*Document rédigé pour le rendu projet SailingLoc — DSP4.*
