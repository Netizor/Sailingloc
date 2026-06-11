import { Router } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.middleware.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ─── Format réponse (snake_case BDD → camelCase frontend) ──
function formatBoat(b, withOwner = false) {
  const base = {
    id: b.id,
    ownerId: b.owner_id,
    title: b.title,
    description: b.description,
    type: b.type,
    manufacturer: b.manufacturer,
    model: b.model,
    year: b.year,
    length: b.length,
    capacity: b.capacity,
    cabins: b.cabins,
    motorizationType: b.motorization_type,
    motorPower: b.motor_power,
    withSkipper: b.with_skipper,
    skipperPrice: b.skipper_price,
    dailyRate: b.price_per_day,
    depositAmount: b.deposit,
    city: b.city,
    port: b.port,
    country: b.country,
    lat: b.latitude,
    lng: b.longitude,
    images: b.images || [],
    equipment: b.amenities || [],
    rules: b.rules,
    welcomeMessage: b.welcome_message,
    requiredLicense: b.required_license,
    status: b.status,
    rating: b.average_rating || 0,
    reviewCount: b.review_count || 0,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }
  if (withOwner && b.users) {
    base.owner = {
      id: b.users.id,
      firstName: b.users.first_name,
      lastName: b.users.last_name,
      avatar: b.users.avatar,
      bio: b.users.bio,
    }
  }
  return base
}

// ─── GET /boats ────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50, parseInt(req.query.limit) || 12)
  const from  = (page - 1) * limit

  let query = supabase
    .from('boats')
    .select('*, users(id, first_name, last_name, avatar)', { count: 'exact' })
    .eq('status', 'active')

  if (req.query.location) {
    query = query.or(`city.ilike.%${req.query.location}%,port.ilike.%${req.query.location}%`)
  }
  const types = req.query['types[]'] || req.query.types
  if (types) {
    const arr = Array.isArray(types) ? types : [types]
    if (arr.length) query = query.in('type', arr)
  }
  if (req.query.capacity) query = query.gte('capacity', parseInt(req.query.capacity))
  if (req.query.minPrice)  query = query.gte('price_per_day', parseFloat(req.query.minPrice))
  if (req.query.maxPrice)  query = query.lte('price_per_day', parseFloat(req.query.maxPrice))
  if (req.query.withSkipper !== undefined) query = query.eq('with_skipper', req.query.withSkipper === 'true')

  const sort = req.query.sort
  if (sort === 'price_asc')   query = query.order('price_per_day', { ascending: true })
  else if (sort === 'price_desc')  query = query.order('price_per_day', { ascending: false })
  else if (sort === 'rating_desc') query = query.order('average_rating', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  query = query.range(from, from + limit - 1)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ message: error.message })

  return res.json({
    data: (data || []).map(b => formatBoat(b, true)),
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
})

// ─── GET /boats/my ─────────────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50, parseInt(req.query.limit) || 10)
  const from  = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('boats')
    .select('*, users(id, first_name, last_name, avatar)', { count: 'exact' })
    .eq('owner_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

    console.error('ERREUR SUPABASE:', error)
    if (error) return res.status(500).json({ message: error.message })
  return res.json({ data: (data || []).map(b => formatBoat(b, true)), total: count || 0, page, limit })
})

// ─── GET /boats/:id ────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  const { data: boat, error } = await supabase
    .from('boats')
    .select('*, users(id, first_name, last_name, avatar, bio, created_at)')
    .eq('id', req.params.id)
    .single()

  if (error || !boat) return res.status(404).json({ message: 'Bateau introuvable' })

  if (boat.status !== 'active') {
    if (!req.user || (req.user.id !== boat.owner_id && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ message: 'Bateau introuvable' })
    }
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, users!author_id(id, first_name, last_name, avatar)')
    .eq('boat_id', boat.id)
    .eq('type', 'RENTER_TO_BOAT')
    .order('created_at', { ascending: false })
    .limit(10)

  return res.json({ ...formatBoat(boat, true), reviews: reviews || [] })
})

// ─── POST /boats ───────────────────────────────────────────
router.post('/', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const {
    title, description, type, manufacturer, model, year, length,
    capacity, cabins, motorizationType, motorPower, withSkipper, skipperPrice,
    dailyRate, depositAmount, city, port, country, lat, lng,
    images, equipment, rules, welcomeMessage, requiredLicense,
    // compatibilité anciens noms
    pricePerDay, deposit, amenities, latitude, longitude,
  } = req.body

  if (!title || !description || !type || !capacity || !(dailyRate || pricePerDay) || !city) {
    return res.status(400).json({ message: 'title, description, type, capacity, dailyRate et city sont requis' })
  }

  const { data: boat, error } = await supabase.from('boats').insert({
    owner_id: req.user.id,
    title: title.trim(),
    description: description.trim(),
    type,
    manufacturer,
    model,
    year,
    length,
    capacity: parseInt(capacity),
    cabins: parseInt(cabins) || 0,
    motorization_type: motorizationType || 'SAIL',
    motor_power: motorPower,
    with_skipper: Boolean(withSkipper),
    skipper_price: skipperPrice,
    price_per_day: parseFloat(dailyRate || pricePerDay),
    deposit: depositAmount ? parseFloat(depositAmount) : (deposit ? parseFloat(deposit) : null),
    city: city.trim(),
    port: port?.trim(),
    country: country?.trim() || 'France',
    latitude: lat || latitude,
    longitude: lng || longitude,
    images: images || [],
    amenities: equipment || amenities || [],
    rules,
    welcome_message: welcomeMessage,
    required_license: requiredLicense,
    status: 'draft',
  }).select('*, users(id, first_name, last_name, avatar)').single()

  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(formatBoat(boat, true))
})

// ─── PUT /boats/:id ────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  const { data: existing } = await supabase.from('boats').select('owner_id').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ message: 'Bateau introuvable' })
  if (existing.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  const b = req.body
  const updates = {
    updated_at: new Date().toISOString(),
  }
  if (b.title !== undefined)          updates.title = b.title
  if (b.description !== undefined)    updates.description = b.description
  if (b.type !== undefined)           updates.type = b.type
  if (b.manufacturer !== undefined)   updates.manufacturer = b.manufacturer
  if (b.model !== undefined)          updates.model = b.model
  if (b.year !== undefined)           updates.year = b.year
  if (b.length !== undefined)         updates.length = b.length
  if (b.capacity !== undefined)       updates.capacity = parseInt(b.capacity)
  if (b.cabins !== undefined)         updates.cabins = parseInt(b.cabins)
  if (b.motorizationType !== undefined) updates.motorization_type = b.motorizationType
  if (b.motorPower !== undefined)     updates.motor_power = b.motorPower
  if (b.withSkipper !== undefined)    updates.with_skipper = b.withSkipper
  if (b.skipperPrice !== undefined)   updates.skipper_price = b.skipperPrice
  if (b.dailyRate !== undefined)      updates.price_per_day = parseFloat(b.dailyRate)
  if (b.depositAmount !== undefined)  updates.deposit = parseFloat(b.depositAmount)
  if (b.city !== undefined)           updates.city = b.city
  if (b.port !== undefined)           updates.port = b.port
  if (b.country !== undefined)        updates.country = b.country
  if (b.lat !== undefined)            updates.latitude = b.lat
  if (b.lng !== undefined)            updates.longitude = b.lng
  if (b.images !== undefined)         updates.images = b.images
  if (b.equipment !== undefined)      updates.amenities = b.equipment
  if (b.rules !== undefined)          updates.rules = b.rules
  if (b.welcomeMessage !== undefined) updates.welcome_message = b.welcomeMessage
  if (b.requiredLicense !== undefined) updates.required_license = b.requiredLicense
  if (b.status !== undefined)         updates.status = b.status

  const { data: updated, error } = await supabase.from('boats').update(updates).eq('id', req.params.id).select('*, users(id, first_name, last_name, avatar)').single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBoat(updated, true))
})
 //PATCH /boats/:id/status 
router.patch('/:id/status', authenticate, async (req, res) => {
  const { data: existing } = await supabase.from('boats').select('owner_id').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ message: 'Bateau introuvable' })
  if (existing.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  const status = req.body.status
  if (!['draft', 'active', 'inactive'].includes(status)) return res.status(400).json({ message: 'Statut invalide' })

  const { data: updated, error } = await supabase.from('boats').update({ status, updated_at: new Date().toISOString() }).eq('id', req.params.id).select('*, users(id, first_name, last_name, avatar)').single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBoat(updated, true))
})

//  DELETE /boats/:id 
router.delete('/:id', authenticate, async (req, res) => {
  const { data: existing } = await supabase.from('boats').select('owner_id').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ message: 'Bateau introuvable' })
  if (existing.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  await supabase.from('boats').update({ status: 'inactive', updated_at: new Date().toISOString() }).eq('id', req.params.id)
  return res.json({ message: 'Bateau désactivé' })
})

// ─── POST /boats/:id/images ────────────────────────────────
router.post('/:id/images', authenticate, async (req, res) => {
  const { imageUrls } = req.body
  const { data: existing } = await supabase.from('boats').select('owner_id, images').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ message: 'Bateau introuvable' })
  if (existing.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  const newImages = [...(existing.images || []), ...(imageUrls || [])]
  const { data: updated, error } = await supabase.from('boats').update({ images: newImages }).eq('id', req.params.id).select('*, users(id, first_name, last_name, avatar)').single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBoat(updated, true))
})

// ─── POST /boats/:id/upload-document ──────────────────────
router.post('/:id/upload-document', authenticate, upload.single('file'), async (req, res) => {
  const { data: existing } = await supabase.from('boats').select('owner_id').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ message: 'Bateau introuvable' })
  if (existing.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  if (!req.file) return res.status(400).json({ message: 'Fichier requis' })

  const docType = req.body.type || 'document'

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sailingloc/documents', resource_type: 'auto' },
      (err, r) => err ? reject(err) : resolve(r)
    )
    stream.end(req.file.buffer)
  })

  const fieldMap = {
    insurance: 'insurance_doc',
    registration: 'registration_doc',
    license: 'license_scan_doc',
  }
  const field = fieldMap[docType] || 'registration_doc'
  const updates = { [field]: result.secure_url, updated_at: new Date().toISOString() }

  const { data: updated, error } = await supabase.from('boats').update(updates).eq('id', req.params.id).select('*, users(id, first_name, last_name, avatar)').single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBoat(updated, true))
})

export default router