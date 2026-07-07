import { Router } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.middleware.js'
import { notifyAdmins } from '../services/notifications.service.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function parseArrayParam(query, key) {
  const raw = query[key] ?? query[`${key}[]`]
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

function applyBoatSearchFilters(query, reqQuery) {
  const countries = parseArrayParam(reqQuery, 'countries')
  const locations = parseArrayParam(reqQuery, 'locations')

  if (reqQuery.country) {
    query = query.ilike('country', `%${reqQuery.country}%`)
  } else if (countries.length) {
    const parts = countries.map((c) => `country.ilike.%${c}%`)
    query = query.or(parts.join(','))
  }

  if (locations.length) {
    const parts = locations.flatMap((loc) => [
      `city.ilike.%${loc}%`,
      `port.ilike.%${loc}%`,
    ])
    query = query.or(parts.join(','))
  } else if (reqQuery.location) {
    const loc = reqQuery.location
    query = query.or(`city.ilike.%${loc}%,port.ilike.%${loc}%,country.ilike.%${loc}%`)
  }

  const types = reqQuery['types[]'] || reqQuery.types
  if (types) {
    const arr = Array.isArray(types) ? types : [types]
    if (arr.length) query = query.in('type', arr)
  }
  if (reqQuery.capacity) query = query.gte('capacity', parseInt(reqQuery.capacity))
  if (reqQuery.minPrice) query = query.gte('price_per_day', parseFloat(reqQuery.minPrice))
  if (reqQuery.maxPrice) query = query.lte('price_per_day', parseFloat(reqQuery.maxPrice))
  if (reqQuery.withSkipper !== undefined) query = query.eq('with_skipper', reqQuery.withSkipper === 'true')

  return query
}

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
    insuranceDoc: b.insurance_doc,
    registrationDoc: b.registration_doc,
    licenseScanDoc: b.license_scan_doc,
    contractDoc: b.contract_doc,
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
      sailingExperienceYears: b.users.sailing_experience_years,
      sailingQualifications: b.users.sailing_qualifications,
      sailingAreas: b.users.sailing_areas,
      sailorBio: b.users.sailor_bio,
      sailorCvStatus: b.users.sailor_cv_status || 'NOT_SUBMITTED',
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
    .select('*, users(id, first_name, last_name, avatar, bio, sailing_experience_years, sailing_qualifications, sailing_areas, sailor_bio, sailor_cv_status, created_at)', { count: 'exact' })
    .eq('status', 'active')

  query = applyBoatSearchFilters(query, req.query)

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
    .select('*, users(id, first_name, last_name, avatar, bio, sailing_experience_years, sailing_qualifications, sailing_areas, sailor_bio, sailor_cv_status, created_at)', { count: 'exact' })
    .eq('owner_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return res.status(500).json({ message: error.message })
  return res.json({ data: (data || []).map(b => formatBoat(b, true)), total: count || 0, page, limit })
})

// ─── GET /boats/destinations/summary ───────────────────────
router.get('/destinations/summary', async (req, res) => {
  const { data, error } = await supabase
    .from('boats')
    .select('country, city, port, images')
    .eq('status', 'active')

  if (error) return res.status(500).json({ message: error.message })

  const byCountry = new Map()
  for (const boat of data || []) {
    const country = (boat.country || 'France').trim()
    if (!byCountry.has(country)) {
      byCountry.set(country, { country, count: 0, image: null })
    }
    const entry = byCountry.get(country)
    entry.count += 1
    if (!entry.image && boat.images?.[0]) entry.image = boat.images[0]
  }

  return res.json({ countries: [...byCountry.values()] })
})

// ─── GET /boats/autocomplete ───────────────────────────────
router.get('/autocomplete', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 2) return res.json({ suggestions: [] })

    const [{ data: cities }, { data: ports }, { data: countries }] = await Promise.all([
      supabase.from('boats').select('city').eq('status', 'active').ilike('city', `%${q}%`).not('city', 'is', null).limit(20),
      supabase.from('boats').select('port').eq('status', 'active').ilike('port', `%${q}%`).not('port', 'is', null).limit(20),
      supabase.from('boats').select('country').eq('status', 'active').ilike('country', `%${q}%`).not('country', 'is', null).limit(10),
    ])

    const seen = new Set()
    const suggestions = []

    for (const row of (cities || [])) {
      if (row.city && !seen.has(row.city.toLowerCase())) {
        seen.add(row.city.toLowerCase())
        suggestions.push({ label: row.city, type: 'city' })
      }
    }
    for (const row of (ports || [])) {
      if (row.port && !seen.has(row.port.toLowerCase())) {
        seen.add(row.port.toLowerCase())
        suggestions.push({ label: row.port, type: 'port' })
      }
    }
    for (const row of (countries || [])) {
      if (row.country && !seen.has(row.country.toLowerCase())) {
        seen.add(row.country.toLowerCase())
        suggestions.push({ label: row.country, type: 'country' })
      }
    }

    return res.json({ suggestions: suggestions.slice(0, 8) })
  } catch (err) {
    next(err)
  }
})

// ─── GET /boats/:id ────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  const { data: boat, error } = await supabase
    .from('boats')
    .select('*, users(id, first_name, last_name, avatar, bio, sailing_experience_years, sailing_qualifications, sailing_areas, sailor_bio, sailor_cv_status, created_at)')
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

// ─── POST /boats ───
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

  notifyAdmins(
    'BOAT_CREATED',
    'Nouvelle annonce créée',
    `"${boat.title}" ajoutée par ${boat.users?.first_name ?? ''} ${boat.users?.last_name ?? ''} (brouillon)`,
    { boatId: boat.id, ownerId: req.user.id }
  ).catch(() => {})

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

  const statusLabels = { active: 'publiée', inactive: 'désactivée', draft: 'repassée en brouillon' }
  notifyAdmins(
    'BOAT_STATUS_CHANGED',
    `Annonce ${statusLabels[status] ?? status}`,
    `"${updated.title}" est maintenant ${statusLabels[status] ?? status}`,
    { boatId: updated.id, status, ownerId: updated.owner_id }
  ).catch(() => {})

  return res.json(formatBoat(updated, true))
})

//  DELETE /boats/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { data: existing } = await supabase.from('boats').select('owner_id').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ message: 'Bateau introuvable' })
  if (existing.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  const { data: deleted } = await supabase.from('boats')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('title, owner_id')
    .single()

  notifyAdmins(
    'BOAT_DELETED',
    'Annonce supprimée',
    `"${deleted?.title ?? 'Bateau #' + req.params.id}" supprimée par ${req.user.role === 'ADMIN' ? 'un admin' : 'son propriétaire'}`,
    { boatId: parseInt(req.params.id), ownerId: deleted?.owner_id }
  ).catch(() => {})

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

  const docType = req.body.docType || req.body.type || 'document'
  const fieldMap = {
    insurance: 'insurance_doc',
    registration: 'registration_doc',
    license: 'license_scan_doc',
    contract: 'contract_doc',
  }
  const field = fieldMap[docType]
  if (!field) return res.status(400).json({ message: 'Type de document invalide' })

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sailingloc/documents', resource_type: 'auto' },
      (err, r) => err ? reject(err) : resolve(r)
    )
    stream.end(req.file.buffer)
  })

  const updates = { [field]: result.secure_url, updated_at: new Date().toISOString() }

  const { data: updated, error } = await supabase.from('boats').update(updates).eq('id', req.params.id).select('*, users(id, first_name, last_name, avatar)').single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBoat(updated, true))
})

export default router