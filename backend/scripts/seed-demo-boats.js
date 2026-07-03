/**
 * Crée des bateaux de démo actifs avec photos Pexels (1 bateau, sans personnes).
 *
 * Usage:
 *   node scripts/seed-demo-boats.js
 *   node scripts/seed-demo-boats.js --email jacob@gmail.com
 *   node scripts/seed-demo-boats.js --force
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { pickBoatPhotos } from './pexels-filters.js'

const force = process.argv.includes('--force')
const emailArg = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1]
  ?? (process.argv.includes('--email') ? process.argv[process.argv.indexOf('--email') + 1] : null)

const SEED_PREFIX = '[DEMO]'
const FALLBACK_IMAGE = '/view-luxurious-yacht-water.jpg'

const DESCRIPTION =
  'Bateau de démonstration SailingLoc. Idéal pour explorer les eaux locales avec confort et sécurité.'

const DEMO_BOATS = [
  { title: 'Cyclades Dream', country: 'Grèce', city: 'Mykonos', port: 'Mykonos', type: 'SAILBOAT', capacity: 8, dailyRate: 890, lat: 37.4467, lng: 25.3289 },
  { title: 'Ionian Star', country: 'Grèce', city: 'Corfou', port: 'Corfou', type: 'CATAMARAN', capacity: 10, dailyRate: 1150, lat: 39.6243, lng: 19.9217 },
  { title: 'Dalmatia Blue', country: 'Croatie', city: 'Split', port: 'Split', type: 'SAILBOAT', capacity: 8, dailyRate: 720, lat: 43.5081, lng: 16.4402 },
  { title: 'Hvar Escape', country: 'Croatie', city: 'Hvar', port: 'Hvar', type: 'CATAMARAN', capacity: 12, dailyRate: 980, lat: 43.1729, lng: 16.4424 },
  { title: 'Balearic Sun', country: 'Espagne', city: 'Palma', port: 'Palma de Mallorca', type: 'SAILBOAT', capacity: 6, dailyRate: 650, lat: 39.5696, lng: 2.6502 },
  { title: 'Costa Brava', country: 'Espagne', city: 'Barcelone', port: 'Barcelone', type: 'MOTORBOAT', capacity: 8, dailyRate: 1100, lat: 41.3851, lng: 2.1734 },
  { title: 'Amalfi Grace', country: 'Italie', city: 'Naples', port: 'Naples', type: 'MOTORBOAT', capacity: 8, dailyRate: 2400, lat: 40.8518, lng: 14.2681 },
  { title: 'Sardinia Pearl', country: 'Italie', city: 'Olbia', port: 'Olbia', type: 'CATAMARAN', capacity: 10, dailyRate: 1350, lat: 40.9237, lng: 9.4961 },
  { title: 'Algarve Wind', country: 'Portugal', city: 'Faro', port: 'Faro', type: 'SAILBOAT', capacity: 6, dailyRate: 580, lat: 37.0194, lng: -7.9322 },
  { title: 'Bodrum Azure', country: 'Turquie', city: 'Bodrum', port: 'Bodrum', type: 'SAILBOAT', capacity: 8, dailyRate: 790, lat: 37.0344, lng: 27.4305 },
  { title: 'Miami Vice', country: 'États-Unis', city: 'Miami', port: 'Miami Beach', type: 'MOTORBOAT', capacity: 10, dailyRate: 3200, lat: 25.7907, lng: -80.1300 },
  { title: 'Florida Keys', country: 'États-Unis', city: 'Key West', port: 'Key West', type: 'MOTORBOAT', capacity: 8, dailyRate: 1450, lat: 24.5551, lng: -81.7800 },
  { title: 'Riviera Maya', country: 'Mexique', city: 'Cancún', port: 'Cancún', type: 'CATAMARAN', capacity: 12, dailyRate: 1250, lat: 21.1619, lng: -86.8515 },
  { title: 'Nassau Paradise', country: 'Bahamas', city: 'Nassau', port: 'Nassau', type: 'MOTORBOAT', capacity: 8, dailyRate: 2800, lat: 25.0343, lng: -77.3963 },
  { title: 'Martinique Bay', country: 'Martinique', city: 'Le Marin', port: 'Le Marin', type: 'CATAMARAN', capacity: 10, dailyRate: 920, lat: 14.4715, lng: -60.8714 },
  { title: 'Phuket Horizon', country: 'Thaïlande', city: 'Phuket', port: 'Phuket', type: 'CATAMARAN', capacity: 12, dailyRate: 1100, lat: 7.8804, lng: 98.3923 },
  { title: 'Bali Spirit', country: 'Indonésie', city: 'Denpasar', port: 'Benoa', type: 'SAILBOAT', capacity: 8, dailyRate: 850, lat: -8.7467, lng: 115.2120 },
  { title: 'Maldives Lagoon', country: 'Maldives', city: 'Malé', port: 'Malé', type: 'CATAMARAN', capacity: 10, dailyRate: 3500, lat: 4.1755, lng: 73.5093 },
  { title: 'Seychelles Pearl', country: 'Seychelles', city: 'Mahé', port: 'Victoria', type: 'MOTORBOAT', capacity: 8, dailyRate: 2900, lat: -4.6191, lng: 55.4513 },
  { title: 'Dubai Prestige', country: 'Émirats arabes unis', city: 'Dubaï', port: 'Dubai Marina', type: 'MOTORBOAT', capacity: 12, dailyRate: 4200, lat: 25.0805, lng: 55.1403 },
  { title: 'Polynesia Dream', country: 'Polynésie française', city: 'Papeete', port: 'Bora Bora', type: 'CATAMARAN', capacity: 10, dailyRate: 3800, lat: -16.5004, lng: -151.7415 },
  { title: 'Essaouira Wind', country: 'Maroc', city: 'Essaouira', port: 'Essaouira', type: 'SAILBOAT', capacity: 6, dailyRate: 480, lat: 31.5085, lng: -9.7595 },
  { title: 'Sydney Harbour', country: 'Australie', city: 'Sydney', port: 'Sydney', type: 'MOTORBOAT', capacity: 8, dailyRate: 2600, lat: -33.8688, lng: 151.2093 },
  { title: "Côte d'Azur Classic", country: 'France', city: 'Nice', port: 'Nice', type: 'SAILBOAT', capacity: 8, dailyRate: 950, lat: 43.7102, lng: 7.2620 },
  { title: 'Saint-Tropez Elite', country: 'France', city: 'Saint-Tropez', port: 'Saint-Tropez', type: 'MOTORBOAT', capacity: 10, dailyRate: 2200, lat: 43.2727, lng: 6.6407 },
]

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Configure SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans backend/.env')
  process.exit(1)
}

const pexelsKey = process.env.PEXEL_API_KEY
if (!pexelsKey) {
  console.error('❌ PEXEL_API_KEY manquant dans backend/.env')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

function boatTypeWord(type) {
  if (type === 'SAILBOAT') return 'sailboat'
  if (type === 'CATAMARAN') return 'catamaran'
  return 'yacht motorboat'
}

function imageQueries(boat) {
  const kind = boatTypeWord(boat.type)
  return [
    `${kind} ${boat.city} sea`,
    `luxury ${kind} ${boat.country} ocean`,
    `single ${kind} sailing open water`,
  ]
}

async function getOwnerId() {
  const email = emailArg || 'owner@demo.fr'
  const { data } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('email', email)
    .maybeSingle()

  if (!data?.id) {
    throw new Error(`Compte propriétaire introuvable (${email}). Utilisez --email votre@email.com`)
  }
  console.log(`👤 Propriétaire : ${data.first_name} ${data.last_name} (${data.email})`)
  return data.id
}

async function clearSeedBoats(ownerId) {
  const { data } = await supabase
    .from('boats')
    .select('id, title')
    .eq('owner_id', ownerId)
    .ilike('title', `${SEED_PREFIX}%`)

  if (!data?.length) return
  await supabase.from('boats').delete().in('id', data.map((b) => b.id))
  console.log(`🗑  ${data.length} bateaux seed supprimés`)
}

async function seedBoats(ownerId) {
  const usedPhotoIds = new Set()
  let created = 0

  for (let i = 0; i < DEMO_BOATS.length; i++) {
    const boat = DEMO_BOATS[i]
    const title = `${SEED_PREFIX} ${boat.title}`

    const { data: existing } = await supabase
      .from('boats')
      .select('id')
      .eq('title', title)
      .eq('owner_id', ownerId)
      .maybeSingle()

    if (existing && !force) continue
    if (existing && force) {
      await supabase.from('boats').delete().eq('id', existing.id)
    }

    process.stdout.write(`📷 ${title}… `)
    const pexelsImages = await pickBoatPhotos(pexelsKey, imageQueries(boat), 3, usedPhotoIds)
    const images = pexelsImages.length ? pexelsImages : [FALLBACK_IMAGE]
    console.log(pexelsImages.length ? `${images.length} photos Pexels` : 'repli local')

    const row = {
      owner_id: ownerId,
      title,
      description: DESCRIPTION,
      type: boat.type,
      capacity: boat.capacity,
      cabins: Math.max(2, Math.floor(boat.capacity / 3)),
      motorization_type: boat.type === 'SAILBOAT' ? 'SAIL' : 'INBOARD',
      with_skipper: true,
      skipper_price: 150,
      price_per_day: boat.dailyRate,
      deposit: boat.dailyRate * 2,
      city: boat.city,
      port: boat.port,
      country: boat.country,
      latitude: boat.lat,
      longitude: boat.lng,
      images,
      amenities: ['GPS', 'Wi-Fi', 'Douche'],
      status: 'active',
      average_rating: 4.5 + (i % 5) * 0.1,
      review_count: 5 + (i % 12),
    }

    const { error } = await supabase.from('boats').insert(row)
    if (error) {
      console.error(`❌ ${error.message}`)
      continue
    }
    created += 1
  }

  console.log(`\n🌍 ${created} bateaux créés avec photos Pexels`)
}

async function main() {
  const ownerId = await getOwnerId()
  if (force) await clearSeedBoats(ownerId)
  await seedBoats(ownerId)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
