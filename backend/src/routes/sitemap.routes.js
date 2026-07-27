import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

const BASE_URL = process.env.FRONTEND_URL || 'https://dsp-dev-o24a-g4.cloud'

// Pages statiques du site — priorité et fréquence de mise à jour indicatives pour Google
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/bateaux', priority: '0.9', changefreq: 'daily' },
  { path: '/bateaux/comparer', priority: '0.5', changefreq: 'weekly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/a-propos', priority: '0.6', changefreq: 'monthly' },
  { path: '/temoignages', priority: '0.5', changefreq: 'weekly' },
  { path: '/guide-proprietaire', priority: '0.6', changefreq: 'monthly' },
  { path: '/devenir-proprietaire', priority: '0.7', changefreq: 'monthly' },
  { path: '/destinations', priority: '0.7', changefreq: 'weekly' },
  { path: '/cgu', priority: '0.3', changefreq: 'yearly' },
  { path: '/mentions-legales', priority: '0.3', changefreq: 'yearly' },
  { path: '/rgpd', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookies', priority: '0.3', changefreq: 'yearly' },
]

function escapeXml(str) {
  return String(str).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c]))
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    // Récupère tous les bateaux actifs directement depuis Supabase
    const { data: boats, error } = await supabase
      .from('boats')
      .select('id, updated_at')
      .eq('status', 'active')

    if (error) throw error

    const staticUrls = staticPages.map((p) => `
  <url>
    <loc>${escapeXml(BASE_URL + p.path)}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

    const boatUrls = (boats || []).map((boat) => `
  <url>
    <loc>${escapeXml(`${BASE_URL}/bateaux/${boat.id}`)}</loc>
    <lastmod>${new Date(boat.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${boatUrls}
</urlset>`

    res.set('Content-Type', 'application/xml')
    res.send(xml)
  } catch (err) {
    console.error('Erreur génération sitemap:', err)
    res.status(500).send('Erreur génération sitemap')
  }
})

export default router