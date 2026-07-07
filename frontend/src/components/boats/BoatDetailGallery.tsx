import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Grid3X3, X, ChevronLeft, ChevronRight, Anchor, Flame } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

const FALLBACK = '/view-luxurious-yacht-water.jpg'

interface BoatDetailGalleryProps {
  images: string[]
  title: string
  interestedCount?: number
}

const BoatDetailGallery: React.FC<BoatDetailGalleryProps> = ({ images, title, interestedCount }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const galleryImages = useMemo(
    () => [...new Set(images.filter(Boolean))],
    [images],
  )

  const displayImages = galleryImages.length > 0 ? galleryImages : [FALLBACK]
  const gridImages = displayImages.slice(0, 5)
  const formattedInterestedCount = (interestedCount ?? 382).toLocaleString('fr-FR')

  const openLightbox = (index: number) => {
    setActiveIndex(index)
    setLightboxOpen(true)
  }

  if (displayImages.length === 0) {
    return (
      <div className="h-[380px] sm:h-[420px] rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <Anchor size={48} className="text-blue-200" />
      </div>
    )
  }

  return (
    <>
      {displayImages.length === 1 ? (
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="relative w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden group"
        >
          <img
            src={displayImages[0]}
            alt={`${title} - photo principale`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </button>
      ) : (
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[380px] sm:h-[420px] rounded-2xl overflow-hidden relative">
          {/* Grande photo à gauche */}
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="col-span-4 sm:col-span-2 row-span-2 relative overflow-hidden group"
          >
            <img
              src={gridImages[0]}
              alt={`${title} - photo principale`}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
            {/* Badge "bateau populaire" */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/95 rounded-xl px-3 py-2 shadow-md max-w-[88%]">
              <Flame size={18} className="text-orange-500 flex-shrink-0" />
              <div className="text-left leading-tight">
                <p className="text-[13px] font-bold text-[#003366]">Bateau populaire - disponibilités limitées !</p>
                <p className="text-[11px] text-[#8A94A6]">{formattedInterestedCount} personnes sont intéressées par ce bateau</p>
              </div>
            </div>
            {/* Bouton mobile */}
            <span className="sm:hidden absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 text-[#003366] text-xs font-semibold px-3 py-2 rounded-lg shadow-md">
              <Grid3X3 size={14} />
              Voir les {displayImages.length} photos
            </span>
          </button>

          {/* Grille 2x2 à droite */}
          {[1, 2, 3, 4].map((idx) => {
            const img = gridImages[idx]
            const isLast = idx === 4
            return (
              <button
                key={idx}
                type="button"
                onClick={() => openLightbox(img ? idx : 0)}
                className="hidden sm:block col-span-1 row-span-1 relative overflow-hidden group"
              >
                {img ? (
                  <img
                    src={img}
                    alt={`${title} - photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
                    <Anchor size={28} className="text-blue-200" />
                  </div>
                )}
                {isLast && (
                  <span className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 text-[#003366] text-xs font-semibold px-3 py-2 rounded-lg shadow-md group-hover:bg-white transition-colors">
                    <Grid3X3 size={14} />
                    Voir les {displayImages.length} photos
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {displayImages.length === 1 && (
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#2563FF] hover:underline"
        >
          <Grid3X3 size={14} />
          Voir la photo
        </button>
      )}

      {lightboxOpen &&
        createPortal(
          <Lightbox
            images={displayImages}
            title={title}
            activeIndex={activeIndex}
            onClose={() => setLightboxOpen(false)}
            onSelect={setActiveIndex}
          />,
          document.body,
        )}
    </>
  )
}

interface LightboxProps {
  images: string[]
  title: string
  activeIndex: number
  onClose: () => void
  onSelect: (i: number) => void
}

const Lightbox: React.FC<LightboxProps> = ({ images, title, activeIndex, onClose, onSelect }) => {
  const goNext = useCallback(() => onSelect((activeIndex + 1) % images.length), [activeIndex, images.length, onSelect])
  const goPrev = useCallback(() => onSelect((activeIndex - 1 + images.length) % images.length), [activeIndex, images.length, onSelect])

  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, goNext, goPrev])

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX === null) return
    const diff = clientX - touchStartX
    if (diff > 50) goPrev()
    else if (diff < -50) goNext()
    setTouchStartX(null)
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      role="dialog"
      aria-modal
      aria-label={`Photos de ${title}`}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm font-medium">
          {activeIndex + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          aria-label="Fermer"
        >
          <X size={22} />
        </button>
      </div>

      <div
        className="relative flex-1 flex items-center justify-center w-full px-4 sm:px-16 py-4 min-h-0"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientX)}
      >
        <img
          src={images[activeIndex]}
          alt={`${title} - photo ${activeIndex + 1}`}
          className="max-h-full max-w-full object-contain rounded-lg select-none"
          draggable={false}
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              aria-label="Photo précédente"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              aria-label="Photo suivante"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="flex gap-2 pb-6 pt-2 overflow-x-auto px-4 shrink-0 scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                'flex-shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all',
                i === activeIndex ? 'border-white scale-105' : 'border-white/30 opacity-60 hover:opacity-90',
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default BoatDetailGallery
