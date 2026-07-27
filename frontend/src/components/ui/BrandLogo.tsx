import React from 'react'

interface BrandLogoProps {
  className?: string
  alt?: string
}

/** Logo clair (fond blanc) + variante sombre (fond dark). */
const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-10 w-auto object-contain',
  alt = 'SailingLoc',
}) => (
  <>
    <img src="/logo.png" alt={alt} className={`${className} dark:hidden`} />
    <img src="/logo-dark.png" alt="" aria-hidden className={`${className} hidden dark:block`} />
  </>
)

export default BrandLogo
