import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import authRouter from './routes/auth.routes.js'
import pushRouter from './routes/push.routes.js'
import boatsRouter from './routes/boats.routes.js'
import bookingsRouter from './routes/bookings.routes.js'
import kycRouter from './routes/kyc.routes.js'
import usersRouter from './routes/users.routes.js'
import {
  contactRouter,
  reviewsRouter,
  messagesRouter,
  favoritesRouter,
  availabilityRouter,
  seasonalPricesRouter,
  notificationsRouter,
  adminRouter,
  reportsRouter,
  //documentsRouter,
  stripeWebhookRouter,
  seoRouter,
  healthRouter,
} from './routes/misc.routes.js'

const app  = express()
const PORT = process.env.PORT || 3000

// ─── Sécurité ──────────────────────────────────────────────
app.use(helmet())

// CORS — n'autoriser que le frontend déclaré en .env
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Rate limit global : 200 req / 15 min par IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}))

// ─── Body parsers ──────────────────────────────────────────
// /stripe/webhook doit recevoir le raw body avant JSON parsing
app.use('/api/stripe', stripeWebhookRouter)

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Routes ────────────────────────────────────────────────
app.use('/api/contact',           contactRouter)
app.use('/api/auth',              authRouter)
app.use('/api/boats',             boatsRouter)
app.use('/api/bookings',          bookingsRouter)
app.use('/api/kyc',               kycRouter)
app.use('/api/users',             usersRouter)
app.use('/api/reviews',           reviewsRouter)
app.use('/api/messages',          messagesRouter)
app.use('/api/favorites',         favoritesRouter)
app.use('/api/availability',      availabilityRouter)
app.use('/api/seasonal-prices',   seasonalPricesRouter)
app.use('/api/notifications',     notificationsRouter)
app.use('/api/push',              pushRouter)
app.use('/api/admin',             adminRouter)
app.use('/api/reports',           reportsRouter)
//app.use('/api/documents',         documentsRouter)
app.use('/api',                   seoRouter)
app.use('/api/health',            healthRouter)

// ─── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} introuvable` })
})

// ─── Erreurs globales ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err)
  res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur' })
})

// ─── Démarrage ─────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`✅  SailingLoc API démarrée sur http://localhost:${PORT}`)
  console.log(`    Environnement : ${process.env.NODE_ENV || 'development'}`)
  console.log(`    Supabase      : ${process.env.SUPABASE_URL ? '✓ configuré' : '✗ SUPABASE_URL manquant !'}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} déjà utilisé.`)
    console.error(`    Arrêtez le processus existant puis relancez :`)
    console.error(`    Windows : npx kill-port ${PORT}`)
    console.error(`    Mac/Linux : lsof -ti:${PORT} | xargs kill -9\n`)
    process.exit(1)
  }
  throw err
})

export default app
