/**
 * Crée des bateaux de démo actifs dans plusieurs pays (catalogue international).
 *
 * Usage:
 *   node scripts/seed-demo-boats.js
 *   node scripts/seed-demo-boats.js --force   # recrée les bateaux seed (titres préfixés [DEMO])
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const force = process.argv.includes('--force')
const SEED_PREFIX = '[DEMO]'

const IMAGE_POOL = [
  '/view-luxurious-yacht-water.jpg',
  '/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg',
  '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg',
  '/view-luxurious-yacht.jpg',
  '/view-luxurious-yacht (1).jpg',
  '/view-luxurious-cruise-ship.jpg',
  '/view-luxurious-cruise-ship (1).jpg',
  '/view-luxurious-cruise-ship (2).jpg',
  '/miami-bayside-landscape.jpg',
  '/boat-navigating-through-canyon.jpg',
  '/ai-generated-boat-picture.jpg',
]

const DESCRIPTION =
  'Bateau de démonstration SailingLoc. Idéal pour explorer les eaux locales avec confort et sécurité.'

const DEMO_BOATS = [
  { title: "Cyclades Dream", country: 'Grèce', city: 'Mykonos', port: 'Mykonos', type: 'SAILBOAT', capacity: 8, dailyRate: 890, lat: 37.4467, lng: 25.3289 },
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
  { title: 'Essaouira Wind', country: 'Maroc', city: 'Essaouira', port: 'Essaouira', type: 'SAILBOAT', capacity: 6, dailyRate: 480, lat: 31.5085, lng: -9.7595 },
  { title: 'Sydney Harbour', country: 'Australie', city: 'Sydney', port: 'Sydney', type: 'MOTORBOAT', capacity: 8, dailyRate: 2600, lat: -33.8688, lng: 151.2093 },
  { title: 'Côte d\'Azur Classic', country: 'France', city: 'Nice', port: 'Nice', type: 'SAILBOAT', capacity: 8, dailyRate: 950, lat: 43.7102, lng: 7.2620 },
  { title: 'Saint-Tropez Elite', country: 'France', city: 'Saint-Tropez', port: 'Saint-Tropez', type: 'MOTORBOAT', capacity: 10, dailyRate: 2200, lat: 43.2727, lng: 6.6407 },
  { title: 'Corse Azur', country: 'France', city: 'Ajaccio', port: 'Ajaccio', type: 'CATAMARAN', capacity: 10, dailyRate: 880, lat: 41.9192, lng: 8.7386 },
  { title: 'Bretagne Sail', country: 'France', city: 'La Rochelle', port: 'La Rochelle', type: 'SAILBOAT', capacity: 6, dailyRate: 520, lat: 46.1603, lng: -1.1511 },
]

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Configure SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans backend/.env')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function getOwnerId() {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'owner@demo.fr')
    .maybeSingle()

  if (!data?.id) {
    throw new Error('Compte owner@demo.fr introuvable. Lancez d\'abord: npm run db:seed')
  }
  return data.id
}

async function clearSeedBoats() {
  const { data } = await supabase.from('boats').select('id, title').ilike('title', `${SEED_PREFIX}%`)
  if (!data?.length) return
  await supabase.from('boats').delete().in('id', data.map((b) => b.id))
  console.log(`🗑  ${data.length} bateaux seed supprimés`)
}

async function seedBoats(ownerId) {
  let created = 0
  for (let i = 0; i < DEMO_BOATS.length; i++) {
    const boat = DEMO_BOATS[i]
    const title = `${SEED_PREFIX} ${boat.title}`
    const images = [
      IMAGE_POOL[i % IMAGE_POOL.length],
      IMAGE_POOL[(i + 3) % IMAGE_POOL.length],
    ]

    const { data: existing } = await supabase
      .from('boats')
      .select('id')
      .eq('title', title)
      .maybeSingle()

    if (existing && !force) {
      continue
    }

    if (existing && force) {
      await supabase.from('boats').delete().eq('id', existing.id)
    }

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
      console.error(`❌ ${title}: ${error.message}`)
      continue
    }
    created += 1
    console.log(`✅ ${title} (${boat.country})`)
  }
  console.log(`\n🌍 ${created} bateaux internationaux créés ou mis à jour`)
}

async function main() {
  const ownerId = await getOwnerId()
  if (force) await clearSeedBoats()
  await seedBoats(ownerId)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
