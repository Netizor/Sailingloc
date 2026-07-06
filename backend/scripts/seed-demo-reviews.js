/**
 * Crée des avis de démo (locataire → bateau) pour afficher la section avis
 * sur le profil propriétaire et les fiches bateaux.
 *
 * Usage:
 *   node scripts/seed-demo-reviews.js
 *   node scripts/seed-demo-reviews.js --email jacob@gmail.com
 *   node scripts/seed-demo-reviews.js --force   # recrée même si des avis existent déjà
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const force = process.argv.includes('--force')
const emailArg = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1]
  ?? (process.argv.includes('--email') ? process.argv[process.argv.indexOf('--email') + 1] : 'jacob@gmail.com')

const DEMO_REVIEWS = [
  {
    renterEmail: 'renter@demo.fr',
    rating: 5,
    comment: 'Navigation parfaite ! Le bateau était impeccable et le propriétaire très réactif. Je recommande sans hésiter.',
    daysAgo: 12,
  },
  {
    renterEmail: 'thomas.leroy@demo.fr',
    rating: 5,
    comment: 'Excellente expérience en Méditerranée. Briefing clair à l\'embarquement, matériel de sécurité complet.',
    daysAgo: 28,
  },
  {
    renterEmail: 'emma.dubois@demo.fr',
    rating: 4,
    comment: 'Très belle sortie en famille. Propriétaire passionné qui connaît bien sa zone. Petit bémol sur les horaires d\'arrivée au port.',
    daysAgo: 45,
  },
  {
    renterEmail: 'claire.rousseau@demo.fr',
    rating: 5,
    comment: 'Week-end mémorable. Communication fluide avant et pendant la location. On reviendra l\'été prochain !',
    daysAgo: 60,
  },
  {
    renterEmail: 'renter@demo.fr',
    rating: 4,
    comment: 'Bateau conforme à l\'annonce, sortie au top. Merci pour les conseils sur les mouillages.',
    daysAgo: 75,
  },
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

function daysAgoDate(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

async function updateBoatRating(boatId) {
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('boat_id', boatId)
    .eq('type', 'RENTER_TO_BOAT')
    .eq('is_published', true)

  if (!allReviews?.length) return

  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
  await supabase
    .from('boats')
    .update({
      average_rating: Math.round(avg * 10) / 10,
      review_count: allReviews.length,
    })
    .eq('id', boatId)
}

async function main() {
  const ownerEmail = emailArg.toLowerCase().trim()

  const { data: owner, error: ownerErr } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('email', ownerEmail)
    .single()

  if (ownerErr || !owner) {
    console.error(`❌ Propriétaire introuvable : ${ownerEmail}`)
    process.exit(1)
  }

  const { data: boats } = await supabase
    .from('boats')
    .select('id, title')
    .eq('owner_id', owner.id)
    .eq('status', 'active')
    .order('id')
    .limit(DEMO_REVIEWS.length)

  if (!boats?.length) {
    console.error(`❌ Aucun bateau actif pour ${ownerEmail}. Lancez d'abord : npm run db:seed:boats`)
    process.exit(1)
  }

  const { count: existingCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .in('boat_id', boats.map((b) => b.id))
    .eq('type', 'RENTER_TO_BOAT')

  if (existingCount > 0 && !force) {
    console.log(`⏭  ${existingCount} avis existent déjà sur les bateaux de ${ownerEmail} — utilise --force pour en ajouter`)
    return
  }

  let created = 0

  for (let i = 0; i < DEMO_REVIEWS.length; i++) {
    const demo = DEMO_REVIEWS[i]
    const boat = boats[i % boats.length]

    const { data: renter } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('email', demo.renterEmail.toLowerCase())
      .maybeSingle()

    if (!renter) {
      console.warn(`⚠  Locataire ${demo.renterEmail} introuvable, avis ignoré`)
      continue
    }

    const startDate = daysAgoDate(demo.daysAgo + 3)
    const endDate = daysAgoDate(demo.daysAgo)

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        boat_id: boat.id,
        renter_id: renter.id,
        start_date: startDate,
        end_date: endDate,
        with_skipper: false,
        skipper_fee: 0,
        service_fee: 50,
        total_price: 450,
        status: 'COMPLETED',
      })
      .select('id')
      .single()

    if (bookingErr) {
      console.error(`❌ Réservation : ${bookingErr.message}`)
      continue
    }

    const { error: reviewErr } = await supabase.from('reviews').insert({
      booking_id: booking.id,
      boat_id: boat.id,
      author_id: renter.id,
      target_user_id: null,
      type: 'RENTER_TO_BOAT',
      rating: demo.rating,
      comment: demo.comment,
      is_published: true,
      created_at: new Date(Date.now() - demo.daysAgo * 86400000).toISOString(),
    })

    if (reviewErr) {
      console.error(`❌ Avis : ${reviewErr.message}`)
      await supabase.from('bookings').delete().eq('id', booking.id)
      continue
    }

    await updateBoatRating(boat.id)
    created++
    console.log(`✅ Avis ${demo.rating}/5 — ${renter.first_name} sur « ${boat.title} »`)
  }

  console.log(`\n🎉 ${created} avis de démo créés pour ${owner.first_name} ${owner.last_name} (${ownerEmail})`)
  console.log(`   Profil public : /proprietaires/${owner.id}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
