import { Router } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'
import { notifyUser } from '../services/notifications.service.js'

const KYC_SELECT = 'kyc_status, kyc_submitted_at, kyc_reviewed_at, kyc_rejection_reason, kyc_verified_at, kyc_document_expires_at'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.mimetype)) return cb(new Error('Format de fichier invalide'))
    cb(null, true)
  },
})

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function formatKycStatus(user) {
  const status = user.kyc_status || (user.kyc_verified_at ? 'APPROVED' : 'NOT_SUBMITTED')

  return {
    status,
    submittedAt: user.kyc_submitted_at || undefined,
    reviewedAt: user.kyc_reviewed_at || user.kyc_verified_at || undefined,
    rejectionReason: user.kyc_rejection_reason || undefined,
    documentExpiresAt: user.kyc_document_expires_at || undefined,
  }
}

function parseDocumentExpiresAt(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function uploadDocument(file, side, userId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `sailingloc/kyc/${userId}`,
        resource_type: 'auto',
        public_id: `${side}-${Date.now()}`,
      },
      (err, result) => err ? reject(err) : resolve(result)
    )
    stream.end(file.buffer)
  })
}

// ─── GET /kyc/status ────────────────────────────────────────
router.get('/status', authenticate, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select(KYC_SELECT)
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatKycStatus(user))
})

// ─── POST /kyc/submit ───────────────────────────────────────
router.post('/submit', authenticate, upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
]), async (req, res) => {
  const frontFile = req.files?.front?.[0]
  const backFile = req.files?.back?.[0]

  if (!frontFile || !backFile) return res.status(400).json({ message: 'Documents recto et verso requis' })

  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select('kyc_status')
    .eq('id', req.user.id)
    .single()

  if (currentUserError) return res.status(500).json({ message: currentUserError.message })
  if (currentUser?.kyc_status === 'PENDING') return res.status(409).json({ message: 'Une vérification est déjà en cours' })
  if (currentUser?.kyc_status === 'APPROVED') return res.status(409).json({ message: 'Votre identité est déjà vérifiée' })

  const [frontUpload, backUpload] = await Promise.all([
    uploadDocument(frontFile, 'front', req.user.id),
    uploadDocument(backFile, 'back', req.user.id),
  ])

  const submittedAt = new Date().toISOString()
  const { data: user, error } = await supabase
    .from('users')
    .update({
      kyc_status: 'PENDING',
      kyc_front_doc: frontUpload.secure_url,
      kyc_back_doc: backUpload.secure_url,
      kyc_submitted_at: submittedAt,
      kyc_reviewed_at: null,
      kyc_rejection_reason: null,
      kyc_verified_at: null,
      kyc_document_expires_at: null,
      updated_at: submittedAt,
    })
    .eq('id', req.user.id)
    .select(KYC_SELECT)
    .single()

  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(formatKycStatus(user))
})

// ─── GET /kyc/admin/pending ─────────────────────────────────
router.get('/admin/pending', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, kyc_status, kyc_front_doc, kyc_back_doc, kyc_submitted_at, kyc_reviewed_at, kyc_rejection_reason')
    .eq('kyc_status', 'PENDING')
    .order('kyc_submitted_at', { ascending: true })

  if (error) return res.status(500).json({ message: error.message })
  return res.json({ data: data || [] })
})

// ─── PATCH /kyc/admin/:userId ───────────────────────────────
router.patch('/admin/:userId', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { status, rejectionReason, documentExpiresAt } = req.body
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Statut invalide' })
  if (status === 'REJECTED' && !rejectionReason?.trim()) return res.status(400).json({ message: 'Motif de refus requis' })

  const reviewedAt = new Date().toISOString()
  const updates = {
    kyc_status: status,
    kyc_reviewed_at: reviewedAt,
    kyc_verified_at: status === 'APPROVED' ? reviewedAt : null,
    kyc_rejection_reason: status === 'REJECTED' ? rejectionReason.trim() : null,
    updated_at: reviewedAt,
  }

  if (status === 'APPROVED') {
    const expiresAt = parseDocumentExpiresAt(documentExpiresAt)
    if (documentExpiresAt && !expiresAt) {
      return res.status(400).json({ message: 'Date de validité invalide' })
    }
    if (expiresAt) updates.kyc_document_expires_at = expiresAt
  } else {
    updates.kyc_document_expires_at = null
  }

  const { data: user, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.params.userId)
    .select(KYC_SELECT)
    .single()

  if (error) return res.status(500).json({ message: error.message })

  const userId = Number(req.params.userId)
  if (status === 'APPROVED') {
    notifyUser(userId, 'KYC_APPROVED', 'Identité vérifiée', 'Votre pièce d\'identité a été approuvée.', {}).catch(() => {})
  } else {
    notifyUser(userId, 'KYC_REJECTED', 'Vérification refusée', rejectionReason.trim(), {}).catch(() => {})
  }

  return res.json(formatKycStatus(user))
})

// ─── POST /kyc/admin/:userId/request-renewal ────────────────
router.post('/admin/:userId/request-renewal', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { reason } = req.body
  if (!reason?.trim()) return res.status(400).json({ message: 'Motif requis' })

  const { data: existing, error: fetchError } = await supabase
    .from('users')
    .select('id, kyc_status, kyc_front_doc')
    .eq('id', req.params.userId)
    .single()

  if (fetchError || !existing) return res.status(404).json({ message: 'Utilisateur introuvable' })
  if (!existing.kyc_front_doc && existing.kyc_status === 'NOT_SUBMITTED') {
    return res.status(400).json({ message: 'Aucune pièce d\'identité enregistrée pour cet utilisateur' })
  }

  const reviewedAt = new Date().toISOString()
  const trimmedReason = reason.trim()

  const { data: user, error } = await supabase
    .from('users')
    .update({
      kyc_status: 'REJECTED',
      kyc_verified_at: null,
      kyc_rejection_reason: trimmedReason,
      kyc_reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    })
    .eq('id', req.params.userId)
    .select(KYC_SELECT)
    .single()

  if (error) return res.status(500).json({ message: error.message })

  notifyUser(
    Number(req.params.userId),
    'KYC_REJECTED',
    'Renouvellement de pièce d\'identité requis',
    trimmedReason,
    { renewal: true },
  ).catch(() => {})

  return res.json(formatKycStatus(user))
})

export default router
