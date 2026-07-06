import React from 'react'
import { Link } from 'react-router-dom'
import { Anchor, Compass, ShieldCheck } from 'lucide-react'
import type { Boat } from '../../types'

interface BoatOwnerCardProps {
  boat: Boat
  onContact?: () => void
}

const BoatOwnerCard: React.FC<BoatOwnerCardProps> = ({ boat, onContact }) => {
  const owner = boat.owner
  if (!owner) return null

  const initials = `${owner.firstName?.[0] ?? ''}${owner.lastName?.[0] ?? ''}`.toUpperCase()
  const fullName = `${owner.firstName} ${owner.lastName}`
  const hasCvInfo = Boolean(
    owner.sailorBio
    || owner.sailingQualifications
    || owner.sailingAreas
    || owner.sailingExperienceYears != null,
  )

  const experienceLabel = owner.sailingExperienceYears != null
    ? `${owner.sailingExperienceYears} an${owner.sailingExperienceYears > 1 ? 's' : ''} d'expérience en navigation`
    : 'Propriétaire sur SailingLoc'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-bold text-[#003366] mb-5">Le Propriétaire</h3>

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
          <p className="text-xs text-[#8A94A6] mt-0.5 flex items-center gap-1">
            <Compass size={12} />
            {experienceLabel}
          </p>
        </div>
      </div>

      {hasCvInfo && (
        <div className="mb-5 rounded-xl border border-gray-100 bg-[#f8f9fa] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#003366] flex items-center gap-1.5">
              <Anchor size={13} />
              CV de marin
            </p>
            {owner.sailorCvStatus === 'APPROVED' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                <ShieldCheck size={11} />
                Vérifié
              </span>
            ) : (
              <span className="text-[10px] text-[#8A94A6]">Déclaré par le propriétaire</span>
            )}
          </div>

          {owner.sailorBio && (
            <p className="text-xs text-[#5A6478] leading-relaxed line-clamp-3 whitespace-pre-line">
              {owner.sailorBio}
            </p>
          )}

          <div className="space-y-2">
            {owner.sailingQualifications && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A94A6] mb-0.5">
                  Permis & qualifications
                </p>
                <p className="text-xs text-[#5A6478] whitespace-pre-line line-clamp-2">
                  {owner.sailingQualifications}
                </p>
              </div>
            )}
            {owner.sailingAreas && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A94A6] mb-0.5">
                  Zones de navigation
                </p>
                <p className="text-xs text-[#5A6478] whitespace-pre-line line-clamp-2">
                  {owner.sailingAreas}
                </p>
              </div>
            )}
          </div>

          <Link
            to={`/proprietaires/${boat.ownerId}`}
            className="inline-block text-xs font-medium text-[#2563FF] hover:underline"
          >
            Voir le profil complet
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#f8f9fa] rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Avis</p>
          <p className="text-lg font-bold text-[#003366]">{boat.reviewCount}</p>
        </div>
        <div className="bg-[#f8f9fa] rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">Note</p>
          <p className="text-lg font-bold text-[#003366]">
            {boat.reviewCount > 0 ? boat.rating.toFixed(1) : '—'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onContact}
        className="w-full py-3 text-sm font-semibold text-[#003366] bg-white border border-gray-200 rounded-xl hover:border-[#2563FF] hover:text-[#2563FF] transition-colors"
      >
        Contacter {owner.firstName}
      </button>
    </div>
  )
}

export default BoatOwnerCard
