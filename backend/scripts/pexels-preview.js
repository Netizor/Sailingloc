/**
 * Récupère des photos Pexels de BATEAUX/YACHTS (sans personnes) et génère
 * une page HTML pour les visualiser.
 *
 * Usage :
 *   node scripts/pexels-preview.js            # jeu de requêtes bateaux par défaut
 *   node scripts/pexels-preview.js 60         # nombre max de photos voulu
 *   node scripts/pexels-preview.js 60 "catamaran on ocean"  # requête custom
 *
 * Résultat : crée scripts/pexels-preview.html et l'ouvre dans le navigateur.
 */
import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { exec } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

const apiKey = process.env.PEXEL_API_KEY
if (!apiKey) {
  console.error('❌ PEXEL_API_KEY manquant dans backend/.env')
  process.exit(1)
}

const maxWanted = parseInt(process.argv[2]) || 40
const customQuery = process.argv[3]

// Requêtes orientées "bateau/paysage marin" (limitent naturellement les gens)
const QUERIES = customQuery
  ? [customQuery]
  : [
      'luxury yacht on sea',
      'sailboat ocean',
      'catamaran sailing',
      'yacht marina',
      'motorboat sea',
      'sailing yacht aerial',
    ]

// Mots qui indiquent une présence humaine -> on rejette la photo
const PEOPLE_WORDS = [
  'man', 'woman', 'women', 'men', 'people', 'person', 'persons', 'human',
  'boy', 'girl', 'child', 'children', 'kid', 'baby', 'family', 'couple',
  'portrait', 'face', 'lady', 'guy', 'group', 'crowd', 'wedding', 'bride',
  'model', 'selfie', 'friends', 'tourist', 'sailor', 'crew', 'fisherman',
  'swimwear', 'bikini', 'swimsuit', 'sitting', 'standing', 'holding',
]

function hasPeople(photo) {
  const text = `${photo.alt || ''}`.toLowerCase()
  return PEOPLE_WORDS.some(w => new RegExp(`\\b${w}\\b`).test(text))
}

async function search(query, perPage) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: apiKey } })
  if (!res.ok) {
    console.error(`⚠️  "${query}" → erreur ${res.status}`)
    return []
  }
  const data = await res.json()
  return data.photos || []
}

console.log(`🔎 Recherche de photos de bateaux (sans personnes)…\n`)

const seen = new Map()
let rejected = 0

for (const query of QUERIES) {
  const photos = await search(query, 80)
  let kept = 0
  for (const p of photos) {
    if (seen.has(p.id)) continue
    if (hasPeople(p)) { rejected++; continue }
    seen.set(p.id, p)
    kept++
    if (seen.size >= maxWanted) break
  }
  console.log(`   • "${query}" : ${kept} gardées`)
  if (seen.size >= maxWanted) break
}

const photos = [...seen.values()].slice(0, maxWanted)

if (!photos.length) {
  console.error('❌ Aucune photo trouvée.')
  process.exit(1)
}

console.log(`\n✅ ${photos.length} photos gardées · ${rejected} rejetées (personnes détectées)`)

const cards = photos.map(p => `
  <figure class="card">
    <img src="${p.src.large}" alt="${p.alt || 'bateau'}" loading="lazy" />
    <figcaption>
      <span title="${(p.alt || '').replace(/"/g, '')}">📷 ${p.photographer}</span>
      <a href="${p.url}" target="_blank">Pexels ↗</a>
    </figcaption>
  </figure>`).join('')

const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pexels — bateaux</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
    h1 { font-size: 20px; }
    .meta { color: #94a3b8; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .card { margin: 0; background: #1e293b; border-radius: 12px; overflow: hidden; }
    .card img { width: 100%; height: 200px; object-fit: cover; display: block; }
    figcaption { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; font-size: 13px; }
    figcaption span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    figcaption a { color: #38bdf8; text-decoration: none; flex-shrink: 0; margin-left: 8px; }
  </style>
</head>
<body>
  <h1>Pexels — bateaux / yachts (filtre anti-personnes)</h1>
  <p class="meta">${photos.length} photos affichées</p>
  <div class="grid">${cards}</div>
</body>
</html>`

const out = join(__dirname, 'pexels-preview.html')
writeFileSync(out, html, 'utf-8')
console.log(`📄 ${out}`)

const opener = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open'
exec(`${opener} "${out}"`)
