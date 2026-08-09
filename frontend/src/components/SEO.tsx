import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://dsp-dev-o24a-g4.cloud'
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`

interface SEOProps {
  title: string
  description: string
  image?: string
}

export function SEO({ title, description, image = DEFAULT_IMAGE }: SEOProps) {
  const location = useLocation()
  const url = `${SITE_URL}${location.pathname}`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
