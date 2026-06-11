import React, { useState } from 'react'
import { Grid3X3, X, ChevronLeft, ChevronRight, Anchor } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

const FALLBACK = [
  '/view-luxurious-yacht-water.jpg',
  '/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg',
  '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg',
  '/view-luxurious-yacht.jpg',
]

interface BoatDetailGalleryProps {
  images: string[]
  title: string
}

const BoatDetailGallery: React.FC<BoatDetailGalleryProps> = ({ images, title }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const galleryImages = (images.length >= 4 ? images : [...images, ...FALLBACK]).slice(0, 4)

  if (galleryImages.length === 0) {
    return (
      <div className="h-[380px] sm:h-[420px] rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <Anchor size={48} className="text-blue-200" />
      </div>
    )
  }

  const openLightbox = (index: number) => {
    setActiveIndex(index)
    setLightboxOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[380px] sm:h-[420px] rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="col-span-4 sm:col-span-2 row-span-2 relative overflow-hidden group"
        >
          <img
            src={galleryImages[0]}
            alt={`${title} — photo principale`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </button>

        {galleryImages[1] && (
          <button
            type="button"
            onClick={() => openLightbox(1)}
            className="hidden sm:block col-span-1 row-span-1 relative overflow-hidden group"
          >
            <img
              src={galleryImages[1]}
              alt={`${title} — photo 2`}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </button>
        )}

        {galleryImages[2] && (
          <button
            type="button"
            onClick={() => openLightbox(2)}
            className="hidden sm:block col-span-1 row-span-1 relative overflow-hidden group"
          >
            <img
              src={galleryImages[2]}
              alt={`${title} — photo 3`}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </button>
        )}

        {galleryImages[3] && (
          <div className="hidden sm:block col-span-2 row-span-1 relative overflow-hidden group">
            <button type="button" onClick={() => openLightbox(3)} className="w-full h-full">
              <img
                src={galleryImages[3]}
                alt={`${title} — photo 4`}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
            </button>
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 text-[#003366] text-xs font-semibold px-3 py-2 rounded-lg shadow-md hover:bg-white transition-colors"
            >
              <Grid3X3 size={14} />
              Voir toutes les photos
            </button>
          </div>
        )}
      </div>

      {lightboxOpen &&
        createPortal(
          <Lightbox
            images={images.length > 0 ? images : FALLBACK}
            title={title}
            activeIndex={activeIndex}
            onClose={() => setLightboxOpen(false)}
            onSelect={setActiveIndex}
          />,
          document.body
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
  const goNext = () => onSelect((activeIndex + 1) % images.length)
  const goPrev = () => onSelect((activeIndex - 1 + images.length) % images.length)

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center" role="dialog" aria-modal>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
        aria-label="Fermer"
      >
        <X size={22} />
      </button>
      <div className="relative flex-1 flex items-center justify-center w-full px-16 py-8">
        <img
          src={images[activeIndex]}
          alt={`${title} — ${activeIndex + 1}`}
          className="max-h-full max-w-full object-contain rounded-lg"
        />
        {images.length > 1 && (
          <>
            <button type="button" onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white">
              <ChevronLeft size={24} />
            </button>
            <button type="button" onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white">
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
      <div className="flex gap-2 pb-6 overflow-x-auto px-4">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              'flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2',
              i === activeIndex ? 'border-white' : 'border-white/30 opacity-60'
            )}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default BoatDetailGallery
