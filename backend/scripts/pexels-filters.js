/**
 * Filtres partagés pour les photos Pexels (bateaux uniquement).
 */
export const PEOPLE_WORDS = [
  'man', 'woman', 'women', 'men', 'people', 'person', 'persons', 'human',
  'boy', 'girl', 'child', 'children', 'kid', 'baby', 'family', 'couple',
  'portrait', 'face', 'lady', 'guy', 'group', 'crowd', 'wedding', 'bride',
  'model', 'selfie', 'friends', 'tourist', 'sailor', 'crew', 'fisherman',
  'swimwear', 'bikini', 'swimsuit', 'sitting', 'standing', 'holding',
]

/** Plusieurs bateaux, paquebots, ports bondés */
export const MULTI_BOAT_WORDS = [
  'fleet', 'marina', 'harbour', 'harbor', 'port', 'dock', 'docked',
  'boats', 'ships', 'yachts', 'vessels', 'flotilla', 'regatta',
  'multiple', 'several', 'many', 'group of', 'row of', 'line of',
  'cruise', 'liner', 'ferry', 'passenger', 'ocean liner', 'cruise ship',
  'cargo', 'container', 'navy', 'warship', 'fishing boats',
]

export function photoText(photo) {
  return `${photo.alt || ''} ${photo.url || ''}`.toLowerCase()
}

export function hasBlockedWords(photo, words) {
  const text = photoText(photo)
  return words.some((w) => new RegExp(`\\b${w.replace(/\s+/g, '\\s+')}\\b`).test(text))
}

export function isSingleBoatPhoto(photo) {
  if (hasBlockedWords(photo, PEOPLE_WORDS)) return false
  if (hasBlockedWords(photo, MULTI_BOAT_WORDS)) return false
  return true
}

export async function searchPexels(apiKey, query, { perPage = 40, page = 1 } = {}) {
  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', String(perPage))
  url.searchParams.set('page', String(page))
  url.searchParams.set('orientation', 'landscape')

  const res = await fetch(url, { headers: { Authorization: apiKey } })
  if (!res.ok) throw new Error(`Pexels ${res.status} pour "${query}"`)
  const data = await res.json()
  return data.photos || []
}

/** Cherche la meilleure photo pour une destination (requêtes par ordre de priorité). */
export async function pickBestPhoto(apiKey, queries, usedIds = new Set()) {
  for (const query of queries) {
    for (let page = 1; page <= 3; page++) {
      const photos = await searchPexels(apiKey, query, { perPage: 40, page })
      for (const photo of photos) {
        if (usedIds.has(photo.id)) continue
        if (!isSingleBoatPhoto(photo)) continue
        usedIds.add(photo.id)
        return {
          id: photo.id,
          url: photo.src.large2x || photo.src.large,
          photographer: photo.photographer,
          pexelsUrl: photo.url,
          alt: photo.alt || query,
          query,
        }
      }
      if (!photos.length) break
    }
  }
  return null
}

/** Récupère plusieurs photos uniques pour un bateau (galerie). */
export async function pickBoatPhotos(apiKey, queries, count = 3, usedIds = new Set()) {
  const picked = []
  for (const query of queries) {
    if (picked.length >= count) break
    for (let page = 1; page <= 3; page++) {
      const photos = await searchPexels(apiKey, query, { perPage: 40, page })
      for (const photo of photos) {
        if (usedIds.has(photo.id)) continue
        if (!isSingleBoatPhoto(photo)) continue
        usedIds.add(photo.id)
        picked.push(photo.src.large2x || photo.src.large)
        if (picked.length >= count) return picked
      }
      if (!photos.length) break
    }
  }
  return picked
}
