import { Router } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.middleware.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ─── Helper format ─────────────────────────────────────────
function formatBoat(b, withOwner = false) {
  const base = {
    id: b.id,
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
    pricePerDay: b.price_per_day,
    deposit: b.deposit,
    city: b.city,
    port: b.port,
    country: b.country,
    latitude: b.latitude,
    longitude: b.longitude,
    images: b.images || [],
    amenities: b.amenities || [],
    requiredLicense: b.required_license,
    status: b.status,
    averageRating: b.average_rating,
    reviewCount: b.review_count,
    createdAt: b.created_at,
  }
  if (withOwner && b.users) {
    base.owner = {
      id: b.users.id,
      firstName: b.users.first_name,
      lastName: b.users.last_name,
      avatar: b.users.avatar,
      bio: b.users.bio,
      createdAt: b.users.created_at,
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

  // Filtres
  if (req.query.location) {
    query = query.or(`city.ilike.%${req.query.location}%,port.ilike.%${req.query.location}%,country.ilike.%${req.query.location}%`)
  }
  if (req.query.types) {
    const types = Array.isArray(req.query.types) ? req.query.types : [req.query.types]
    query = query.in('type', types)
  }
  if (req.query.capacity) query = query.gte('capacity', parseInt(req.query.capacity))
  if (req.query.minPrice) query = query.gte('price_per_day', parseFloat(req.query.minPrice))
  if (req.query.maxPrice) query = query.lte('price_per_day', parseFloat(req.query.maxPrice))
  if (req.query.withSkipper !== undefined) query = query.eq('with_skipper', req.query.withSkipper === 'true')

  // Tri
  const sort = req.query.sort
  if (sort === 'price_asc')  query = query.order('price_per_day', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price_per_day', { ascending: false })
  else if (sort === 'rating_desc') query = query.order('average_rating', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  query = query.range(from, from + limit - 1)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ message: error.message })

  return res.json({
    items: (data || []).map(b => formatBoat(b, true)),
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
})

// ─── GET /boats/my ─────────────────────────────────────────
router.get('/my', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50, parseInt(req.query.limit) || 10)
  const from  = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('boats')
    .select('*, users(id, first_name, last_name, avatar)', { count: 'exact' })
    .eq('owner_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return res.status(500).json({ message: error.message })
  return res.json({ items: (data || []).map(b => formatBoat(b, true)), total: count || 0, page, limit })
})

// ─── GET /boats/:id ────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  const { data: boat, error } = await supabase
    .from('boats')
    .select('*, users(id, first_name, last_name, avatar, bio, created_at)')
    .eq('id', req.params.id)
    .single()

  if (error || !boat) return res.status(404).json({ message: 'Bateau introuvable' })

  // Seul le propriétaire peut voir les bateaux draft/inactive
  if (boat.status !== 'active') {
    if (!req.user || (req.user.id !== boat.owner_id && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ message: 'Bateau introuvable' })
    }
  }

  // Avis
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, users(id, first_name, last_name, avatar)')
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
    pricePerDay, deposit, city, port, country, latitude, longitude,
    images, amenities, requiredLicense,
  } = req.body

  if (!title || !description || !type || !capacity || !pricePerDay || !city) {
    return res.status(400).json({ message: 'title, description, type, capacity, pricePerDay et city sont requis' })
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
    price_per_day: parseFloat(pricePerDay),
    deposit: deposit ? parseFloat(deposit) : null,
    city: city.trim(),
    port: port?.trim(),
    country: country?.trim() || 'France',
    latitude,
    longitude,
    images: images || [],
    amenities: amenities || [],
    required_license: requiredLicense,
    status: 'draft',
  }).select().single()

  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(formatBoat(boat))
})

// ─── PATCH /boats/:id ──────────────────────────────────────
router.patch('/:id', authenticate, async (req, res) => {
  const { data: boat } = await supabase.from('boats').select('owner_id').eq('id', req.params.id).single()
  if (!boat) return res.status(404).json({ message: 'Bateau introuvable' })
  if (boat.owner_id !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const allowed = [
    'title','description','type','manufacturer','model','year','length',
    'capacity','cabins','with_skipper','skipper_price','price_per_day',
    'deposit','city','port','country','latitude','longitude','images',
    'amenities','required_license','status','motorization_type','motor_power',
  ]
  const updates = {}
  for (const key of allowed) {
    // Accepte aussi camelCase depuis le frontend
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    const snake = key
    if (req.body[camel] !== undefined) updates[snake] = req.body[camel]
    else if (req.body[snake] !== undefined) updates[snake] = req.body[snake]
  }
  updates.updated_at = new Date().toISOString()

  const { data: updated, error } = await supabase.from('boats').update(updates).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBoat(updated))
})

// ─── DELETE /boats/:id ─────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  const { data: boat } = await supabase.from('boats').select('owner_id, status').eq('id', req.params.id).single()
  if (!boat) return res.status(404).json({ message: 'Bateau introuvable' })
  if (boat.owner_id !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  // Soft delete → status = 'inactive'
  await supabase.from('boats').update({ status: 'inactive', updated_at: new Date().toISOString() }).eq('id', req.params.id)
  return res.json({ message: 'Bateau désactivé' })
})

// ─── POST /boats/:id/images ────────────────────────────────
router.post('/:id/images', authenticate, upload.array('images', 10), async (req, res) => {
  const { data: boat } = await supabase.from('boats').select('owner_id, images').eq('id', req.params.id).single()
  if (!boat) return res.status(404).json({ message: 'Bateau introuvable' })
  if (boat.owner_id !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Accès refusé' })
  }
  if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Aucune image fournie' })

  const urls = []
  for (const file of req.files) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sailingloc/boats', resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      )
      stream.end(file.buffer)
    })
    urls.push(result.secure_url)
  }

  const newImages = [...(boat.images || []), ...urls]
  await supabase.from('boats').update({ images: newImages }).eq('id', req.params.id)
  return res.json({ images: newImages })
})

export default router
