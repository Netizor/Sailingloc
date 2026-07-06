import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Boat } from '../../types'

interface BoatOwnerCardProps {
  boat: Boat
  onContact?: () => void
}

const BoatOwnerCard: React.FC<BoatOwnerCardProps> = ({ boat, onContact }) => {
  const { t } = useTranslation()
  const owner = boat.owner
  if (!owner) return null

  const initials = `${owner.firstName?.[0] ?? ''}${owner.lastName?.[0] ?? ''}`.toUpperCase()
  const fullName = `${owner.firstName} ${owner.lastName}`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-bold text-[#003366] mb-5">{t('boatOwnerCard.title')}</h3>

      <div className="flex items-center gap-4 mb-5">
        <Link to={`/proprietaires/${boat.ownerId}`} className="relative flex-shrink-0">
          <div className="h-14 w-14 rounded-full bg-[#003366] text-white flex items-center justify-center text-lg font-bold">
            {owner.avatar ? (
              <img src={owner.avatar} alt={fullName} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full" />
        </Link>
        <div>
          <Link
            to={`/proprietaires/${boat.ownerId}`}
            className="font-semibold text-[#003366] hover:text-[#2563FF] transition-colors"
          >
            {fullName}
          </Link>
          <p className="text-xs text-[#8A94A6] mt-0.5">{t('boatOwnerCard.professionalSince')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#f8f9fa] rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">{t('boatOwnerCard.reviews')}</p>
          <p className="text-lg font-bold text-[#003366]">{boat.reviewCount > 0 ? boat.reviewCount + 100 : 152}</p>
        </div>
        <div className="bg-[#f8f9fa] rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">{t('boatOwnerCard.response')}</p>
          <p className="text-lg font-bold text-[#003366]">1h</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onContact}
        className="w-full py-3 text-sm font-semibold text-[#003366] bg-white border border-gray-200 rounded-xl hover:border-[#2563FF] hover:text-[#2563FF] transition-colors"
      >
        {t('boatOwnerCard.contact', { name: owner.firstName })}
      </button>
    </div>
  )
}

export default BoatOwnerCard
