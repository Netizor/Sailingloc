/**
 * Télécharge une photo Pexels par destination et génère
 * frontend/src/data/destination-pexels-images.json
 *
 * Usage : node scripts/fetch-destination-images.js
 */
import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { pickBestPhoto } from './pexels-filters.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../../frontend/src/data/destination-pexels-images.json')

const apiKey = process.env.PEXEL_API_KEY
if (!apiKey) {
  console.error('❌ PEXEL_API_KEY manquant dans backend/.env')
  process.exit(1)
}

/** slug → requêtes Pexels (une seule embarcation, contexte local) */
const DESTINATION_QUERIES = {
  france: ['luxury yacht french riviera sea', 'sailboat mediterranean france'],
  italie: ['yacht amalfi coast italy', 'sailboat sardinia sea'],
  espagne: ['yacht ibiza mediterranean', 'sailboat balearic islands spain'],
  croatie: ['yacht split croatia adriatic', 'sailboat hvar croatia'],
  grece: ['yacht cyclades greece', 'sailboat mykonos aegean sea'],
  portugal: ['yacht algarve portugal', 'sailboat lisbon coast'],
  turquie: ['yacht bodrum turkey', 'gulet turkish coast sea'],
  'etats-unis': ['yacht miami florida ocean', 'sailboat california coast'],
  mexique: ['yacht cancun caribbean', 'catamaran riviera maya'],
  bahamas: ['yacht bahamas turquoise water', 'sailboat exuma bahamas'],
  martinique: ['catamaran caribbean island', 'yacht tropical caribbean sea'],
  thailande: ['yacht phuket thailand', 'longtail boat phang nga bay'],
  indonesie: ['yacht bali indonesia sea', 'sailboat komodo indonesia'],
  maroc: ['yacht essaouira morocco', 'sailboat atlantic morocco'],
  australie: ['yacht whitsundays australia', 'sailboat sydney harbour single'],
  malte: ['yacht malta mediterranean', 'sailboat valletta malta'],
  maldives: ['yacht maldives turquoise lagoon', 'dhoni maldives ocean'],
  seychelles: ['yacht seychelles indian ocean', 'catamaran seychelles island'],
  'emirats-arabes-unis': ['yacht dubai palm jumeirah', 'luxury yacht dubai marina'],
  monaco: ['luxury yacht monaco riviera', 'superyacht monte carlo'],
  'costa-rica': ['yacht costa rica pacific', 'sailboat guanacaste costa rica'],
  'republique-dominicaine': ['yacht punta cana caribbean', 'catamaran dominican republic'],
  maurice: ['catamaran mauritius lagoon', 'yacht mauritius indian ocean'],
  'polynesie-francaise': ['yacht bora bora lagoon', 'sailboat tahiti polynesia'],
  'cap-vert': ['sailboat cape verde atlantic', 'yacht cape verde islands'],
  'sri-lanka': ['yacht sri lanka indian ocean', 'sailboat mirissa sri lanka'],
  'saint-tropez': ['luxury yacht saint tropez', 'sailboat french riviera'],
  corse: ['yacht corsica mediterranean', 'sailboat bonifacio corsica'],
  'cote-azur': ['yacht nice french riviera', 'sailboat cannes mediterranean'],
  bretagne: ['sailboat brittany atlantic france', 'yacht breton coast'],
  mediterranee: ['luxury yacht mediterranean sea', 'sailboat mediterranean open sea'],
  caraibes: ['catamaran caribbean turquoise', 'yacht tropical caribbean'],
}

const usedIds = new Set()
const results = {}
let ok = 0
let fail = 0

console.log('🌍 Récupération des photos Pexels par destination…\n')

for (const [slug, queries] of Object.entries(DESTINATION_QUERIES)) {
  try {
    const photo = await pickBestPhoto(apiKey, queries, usedIds)
    if (photo) {
      results[slug] = photo
      ok++
      console.log(`✅ ${slug.padEnd(22)} → ${photo.query}`)
    } else {
      fail++
      console.log(`⚠️  ${slug.padEnd(22)} → aucune photo trouvée`)
    }
  } catch (err) {
    fail++
    console.log(`❌ ${slug.padEnd(22)} → ${err.message}`)
  }
}

writeFileSync(OUT, JSON.stringify(results, null, 2), 'utf-8')
console.log(`\n📄 ${OUT}`)
console.log(`✅ ${ok} photos · ⚠️ ${fail} manquantes`)
