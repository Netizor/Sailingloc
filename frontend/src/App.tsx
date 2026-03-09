import React, { Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Layout, { ProtectedRoute, OwnerRoute, AdminRoute } from './components/layout/Layout'
import { FullPageSpinner } from './components/ui/Spinner'
import CookieBanner from './components/ui/CookieBanner'
import { initSessionGuard } from './store/auth.store'

// ─── Pages — lazy loaded for code splitting ───────────────────────────────────
const Home = React.lazy(() => import('./pages/Home'))
const Search = React.lazy(() => import('./pages/Search'))
const BoatDetail = React.lazy(() => import('./pages/BoatDetail'))
const Login = React.lazy(() => import('./pages/auth/Login'))
const Register = React.lazy(() => import('./pages/auth/Register'))
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'))
const VerifyEmail   = React.lazy(() => import('./pages/auth/VerifyEmail'))
const RenterDashboard = React.lazy(() => import('./pages/dashboard/RenterDashboard'))
const MyBookings = React.lazy(() => import('./pages/dashboard/MyBookings'))
const OwnerDashboard = React.lazy(() => import('./pages/owner/OwnerDashboard'))
const MyBoats = React.lazy(() => import('./pages/owner/MyBoats'))
const CreateEditBoat = React.lazy(() => import('./pages/owner/CreateEditBoat'))
const ManageAvailability = React.lazy(() => import('./pages/owner/ManageAvailability'))
const ManageSeasonalPrices = React.lazy(() => import('./pages/owner/ManageSeasonalPrices'))
const OwnerRevenues = React.lazy(() => import('./pages/owner/OwnerRevenues'))
const OwnerBookings = React.lazy(() => import('./pages/owner/OwnerBookings'))
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'))
const AdminBoats = React.lazy(() => import('./pages/admin/AdminBoats'))
const AdminBookings = React.lazy(() => import('./pages/admin/AdminBookings'))
const AdminReports  = React.lazy(() => import('./pages/admin/AdminReports'))
const AdminReviews  = React.lazy(() => import('./pages/admin/AdminReviews'))
const Notifications = React.lazy(() => import('./pages/dashboard/Notifications'))
const UserProfile = React.lazy(() => import('./pages/dashboard/UserProfile'))
const NotificationDetail = React.lazy(() => import('./pages/dashboard/NotificationDetail'))
const MyFavorites = React.lazy(() => import('./pages/dashboard/MyFavorites'))
const BookingDetail = React.lazy(() => import('./pages/dashboard/BookingDetail'))
const LeaveReview = React.lazy(() => import('./pages/dashboard/LeaveReview'))
const Messages = React.lazy(() => import('./pages/dashboard/Messages'))
const Conversation = React.lazy(() => import('./pages/dashboard/Conversation'))
const NotFound = React.lazy(() => import('./pages/NotFound'))

// ── Nouvelles pages ────────────────────────────────────────────────────────────
const MyPayments = React.lazy(() => import('./pages/dashboard/MyPayments'))
const PaymentMethods = React.lazy(() => import('./pages/dashboard/PaymentMethods'))
const KycVerification = React.lazy(() => import('./pages/dashboard/KycVerification'))
const SavedSearches = React.lazy(() => import('./pages/dashboard/SavedSearches'))
const OwnerProfile = React.lazy(() => import('./pages/OwnerProfile'))
const Destination = React.lazy(() => import('./pages/Destination'))
const Destinations = React.lazy(() => import('./pages/Destinations'))

// ── Pages statiques publiques ──────────────────────────────────────────────────
const Faq = React.lazy(() => import('./pages/Faq'))
const Contact = React.lazy(() => import('./pages/Contact'))
const APropos = React.lazy(() => import('./pages/APropos'))
const GuideProprietaire = React.lazy(() => import('./pages/GuideProprietaire'))

// ── Comparateur ────────────────────────────────────────────────────────────────
const Comparer = React.lazy(() => import('./pages/Comparer'))

// ── Pages légales ──────────────────────────────────────────────────────────────
const Cgu = React.lazy(() => import('./pages/legal/Cgu'))
const MentionsLegales = React.lazy(() => import('./pages/legal/MentionsLegales'))
const Rgpd = React.lazy(() => import('./pages/legal/Rgpd'))
const Cookies = React.lazy(() => import('./pages/legal/Cookies'))

// ─── TanStack Query client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Vérifie au démarrage si la session "sans souvenir" a expiré (navigateur fermé)
  useEffect(() => { initSessionGuard() }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* ── Public routes ─────────────────────────────────────────── */}
              <Route index element={<Home />} />
              <Route path="bateaux" element={<Search />} />
              <Route path="bateaux/:id" element={<BoatDetail />} />
              <Route path="connexion" element={<Login />} />
              <Route path="inscription" element={<Register />} />
              <Route path="mot-de-passe-oublie" element={<ForgotPassword />} />
              <Route path="reinitialiser-mot-de-passe" element={<ResetPassword />} />
              <Route path="verifier-email" element={<VerifyEmail />} />
              <Route path="faq" element={<Faq />} />
              <Route path="contact" element={<Contact />} />
              <Route path="a-propos" element={<APropos />} />
              <Route path="guide-proprietaire" element={<GuideProprietaire />} />
              <Route path="cgu" element={<Cgu />} />
              <Route path="mentions-legales" element={<MentionsLegales />} />
              <Route path="rgpd" element={<Rgpd />} />
              <Route path="cookies" element={<Cookies />} />
              <Route path="bateaux/comparer" element={<Comparer />} />
              {/* C3 — Profil public propriétaire */}
              <Route path="proprietaires/:id" element={<OwnerProfile />} />
              {/* C10 — Pages destination */}
              <Route path="destinations" element={<Destinations />} />
              <Route path="destinations/:port" element={<Destination />} />

              {/* ── Renter (any authenticated user) ───────────────────────── */}
              <Route path="mon-espace" element={<ProtectedRoute />}>
                <Route index element={<RenterDashboard />} />
                <Route path="reservations" element={<MyBookings />} />
                <Route path="reservations/:id" element={<BookingDetail />} />
                <Route path="reservations/:id/avis" element={<LeaveReview />} />
                <Route path="favoris" element={<MyFavorites />} />
                <Route path="messages" element={<Messages />} />
                <Route path="messages/:conversationId" element={<Conversation />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="notifications/:id" element={<NotificationDetail />} />
                <Route path="profil" element={<UserProfile />} />
                {/* D3 — Historique des paiements */}
                <Route path="paiements" element={<MyPayments />} />
                {/* D6 — Cartes de paiement sauvegardées */}
                <Route path="cartes" element={<PaymentMethods />} />
                {/* C1 — KYC */}
                <Route path="verification" element={<KycVerification />} />
                {/* C9 — Recherches sauvegardées */}
                <Route path="alertes" element={<SavedSearches />} />
              </Route>

              {/* ── Owner (OWNER or ADMIN role) ───────────────────────────── */}
              <Route path="proprietaire" element={<OwnerRoute />}>
                <Route index element={<OwnerDashboard />} />
                <Route path="bateaux" element={<MyBoats />} />
                <Route path="bateaux/nouveau" element={<CreateEditBoat />} />
                <Route path="bateaux/:id/editer" element={<CreateEditBoat />} />
                <Route path="bateaux/:id/disponibilites" element={<ManageAvailability />} />
                <Route path="bateaux/:id/tarifs" element={<ManageSeasonalPrices />} />
                <Route path="reservations" element={<OwnerBookings />} />
                {/* D1 — Propriétaire évalue un locataire */}
                <Route path="reservations/:id/avis" element={<LeaveReview />} />
                <Route path="revenus" element={<OwnerRevenues />} />
              </Route>

              {/* ── Admin (ADMIN role only) ───────────────────────────────── */}
              <Route path="admin" element={<AdminRoute />}>
                <Route index element={<AdminDashboard />} />
                <Route path="utilisateurs" element={<AdminUsers />} />
                <Route path="bateaux" element={<AdminBoats />} />
                <Route path="reservations" element={<AdminBookings />} />
                {/* F3 — Signalements */}
                <Route path="signalements" element={<AdminReports />} />
                {/* F4 — Modération des avis */}
                <Route path="avis" element={<AdminReviews />} />
              </Route>

              {/* ── 404 ───────────────────────────────────────────────────── */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
        {/* RGPD — Bandeau de consentement aux cookies (affiché à la première visite) */}
        {/* Doit être à l'intérieur de <BrowserRouter> car il contient un <Link> */}
        <CookieBanner />
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#111827',
            borderRadius: '12px',
            border: '1px solid #f3f4f6',
            boxShadow:
              '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.05)',
            fontSize: '14px',
            maxWidth: '380px',
          },
          success: {
            iconTheme: {
              primary: '#0369a1',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  )
}
