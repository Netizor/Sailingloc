import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, Anchor } from 'lucide-react'
import { cn } from '../../lib/utils'
import { createPortal } from 'react-dom'

interface ImageGalleryProps {
  images: string[]
  title: string
  className?: string
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title, className }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (images.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl overflow-hidden aspect-video',
          'bg-gradient-to-br from-blue-50 to-sky-100',
          'flex flex-col items-center justify-center gap-3',
          className
        )}
      >
        <Anchor size={52} className="text-blue-200" strokeWidth={1.5} />
        <span className="text-sm text-blue-300 font-medium">Aucune photo disponible</span>
      </div>
    )
  }

  const mainImage = images[activeIndex]

  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActiveIndex((i) => (i + 1) % images.length)
  }
  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActiveIndex((i) => (i - 1 + images.length) % images.length)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Main image */}
      <div
        className="relative rounded-2xl overflow-hidden aspect-video bg-gray-100 cursor-zoom-in group"
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Agrandir l'image"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setLightboxOpen(true) }}
      >
        <img
          src={mainImage}
          alt={`${title} — image ${activeIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Zoom hint */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
          <ZoomIn size={13} />
          Agrandir
        </div>

        {/* Arrow nav on main */}
        {images.length > 1 && (
          <>
            <NavArrow direction="left" onClick={goPrev} />
            <NavArrow direction="right" onClick={goNext} />
          </>
        )}

        {/* Image count */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'flex-shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all snap-start',
                'focus:outline-none focus:ring-2 focus:ring-ocean-500',
                i === activeIndex
                  ? 'border-ocean-600 shadow-md scale-105'
                  : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
              )}
              aria-label={`Image ${i + 1}`}
              aria-pressed={i === activeIndex}
            >
              <img
                src={img}
                alt={`${title} — miniature ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen &&
        createPortal(
          <Lightbox
            images={images}
            title={title}
            activeIndex={activeIndex}
            onClose={() => setLightboxOpen(false)}
            onNext={goNext}
            onPrev={goPrev}
            onSelect={setActiveIndex}
          />,
          document.body
        )}
    </div>
  )
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

interface LightboxProps {
  images: string[]
  title: string
  activeIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  onSelect: (i: number) => void
}

const Lightbox: React.FC<LightboxProps> = ({
  images,
  title,
  activeIndex,
  onClose,
  onNext,
  onPrev,
  onSelect,
}) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onNext, onPrev])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Galerie photo"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        aria-label="Fermer"
      >
        <X size={22} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {activeIndex + 1} / {images.length}
      </div>

      {/* Main image */}
      <div className="relative flex-1 flex items-center justify-center w-full px-16 py-8">
        <img
          src={images[activeIndex]}
          alt={`${title} — image ${activeIndex + 1}`}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
        />

        {images.length > 1 && (
          <>
            <NavArrow direction="left" onClick={onPrev} />
            <NavArrow direction="right" onClick={onNext} />
          </>
        )}
      </div>

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-4 px-4 max-w-full snap-x">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={cn(
                'flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all snap-start',
                i === activeIndex
                  ? 'border-white scale-105'
                  : 'border-white/20 opacity-50 hover:opacity-80'
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Nav Arrow ───────────────────────────────────────────────────────────────

const NavArrow: React.FC<{ direction: 'left' | 'right'; onClick: (e: React.MouseEvent) => void }> = ({
  direction,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm z-10',
      direction === 'left' ? 'left-3' : 'right-3'
    )}
    aria-label={direction === 'left' ? 'Image précédente' : 'Image suivante'}
  >
    {direction === 'left' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
  </button>
)

export default ImageGallery
export type { ImageGalleryProps }
