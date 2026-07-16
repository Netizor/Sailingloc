import React from 'react'
import { Info, Shield } from 'lucide-react'
import { cn, formatPrice } from '../../lib/utils'

interface PriceBreakdownProps {
  dailyRate: number
  totalDays: number
  platformFeePercent?: number
  depositAmount: number
  withSkipper?: boolean
  skipperPrice?: number
  /** Pourcentage de remise dégressive appliquée (E2) */
  discountPercent?: number
  className?: string
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  dailyRate,
  totalDays,
  platformFeePercent = 10,
  depositAmount,
  withSkipper = false,
  skipperPrice = 0,
  discountPercent = 0,
  className,
}) => {
  if (totalDays <= 0) return null

  const boatSubtotal = dailyRate * totalDays
  const discountAmount = discountPercent > 0 ? Math.round(boatSubtotal * discountPercent / 100) : 0
  const skipperSubtotal = withSkipper ? skipperPrice * totalDays : 0
  const subtotalBeforeFee = boatSubtotal - discountAmount + skipperSubtotal
  const platformFee = Math.round(subtotalBeforeFee * (platformFeePercent / 100))
  const total = subtotalBeforeFee + platformFee

  return (
    <div className={cn('bg-gray-50 rounded-xl border border-gray-100 overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <h3 className="text-sm font-semibold text-gray-900">Détail du prix</h3>
      </div>

      <div className="px-4 py-4 flex flex-col gap-2.5">
        {/* Daily rate × days */}
        <LineItem
          label={`${formatPrice(dailyRate)} × ${totalDays} jour${totalDays > 1 ? 's' : ''}`}
          amount={boatSubtotal}
        />

        {/* Remise dégressive */}
        {discountAmount > 0 && (
          <LineItem
            label={<span className="text-green-700 dark:text-green-400">Remise longue durée (-{discountPercent}%)</span>}
            amount={-discountAmount}
            className="text-green-700 dark:text-green-400"
          />
        )}

        {/* Skipper */}
        {withSkipper && skipperPrice > 0 && (
          <LineItem
            label={`Skipper ${formatPrice(skipperPrice)}/jour × ${totalDays}j`}
            amount={skipperSubtotal}
          />
        )}

        {/* Platform fee */}
        <LineItem
          label={
            <span className="flex items-center gap-1.5">
              Frais de service ({platformFeePercent}%)
              <span
                className="text-gray-400 cursor-help"
                title="Les frais de service couvrent l'assurance, le support client et la maintenance de la plateforme."
              >
                <Info size={13} />
              </span>
            </span>
          }
          amount={platformFee}
        />

        {/* Divider */}
        <div className="border-t border-gray-200 my-1" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">Total à payer</span>
          <span className="text-xl font-bold text-ocean-700">{formatPrice(total)}</span>
        </div>

        {/* Deposit note - informational only */}
        {depositAmount > 0 && (
          <div className="mt-1 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 flex items-start gap-2">
            <Shield size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">
                Caution indicative : {formatPrice(depositAmount)}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Montant convenu avec le propriétaire avant le départ. Non prélevé en ligne sur SailingLoc.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface LineItemProps {
  label: React.ReactNode
  amount: number
  className?: string
}

const LineItem: React.FC<LineItemProps> = ({ label, amount, className }) => (
  <div className={cn('flex items-center justify-between gap-4 text-sm', className)}>
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-gray-900 whitespace-nowrap">{formatPrice(amount)}</span>
  </div>
)

export default PriceBreakdown
export type { PriceBreakdownProps }
