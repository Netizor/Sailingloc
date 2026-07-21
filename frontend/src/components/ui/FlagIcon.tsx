import React from 'react'
import { cn } from '../../lib/utils'

type FlagCode = 'fr' | 'gb'

interface FlagIconProps {
  code: FlagCode
  className?: string
}

/** Small SVG flags - render correctly on Windows (unlike emoji flags). */
const FlagIcon: React.FC<FlagIconProps> = ({ code, className }) => {
  const base = cn('inline-block h-3.5 w-5 rounded-[2px] overflow-hidden shadow-sm ring-1 ring-black/10', className)

  if (code === 'fr') {
    return (
      <svg viewBox="0 0 3 2" className={base} aria-hidden="true">
        <rect width="1" height="2" x="0" fill="#002395" />
        <rect width="1" height="2" x="1" fill="#FFFFFF" />
        <rect width="1" height="2" x="2" fill="#ED2939" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 60 30" className={base} aria-hidden="true">
      <clipPath id="gb-clip">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <g clipPath="url(#gb-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  )
}

export default FlagIcon
