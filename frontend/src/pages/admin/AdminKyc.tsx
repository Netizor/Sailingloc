import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { kycApi, type PendingKycUser } from '../../api/kyc.api'
import { formatDate } from '../../lib/utils'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'

const KycCard: React.FC<{ user: PendingKycUser }> = ({ user }) => {
  const queryClient = useQueryClient()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const reviewMutation = useMutation({
    mutationFn: (payload: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
      kycApi.review(user.id, payload),
    onSuccess: (_, { status }) => {
      toast.success(status === 'APPROVED' ? 'Identité approuvée' : 'Identité refusée')
      setRejectOpen(false)
      setRejectionReason('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc', 'pending'] })
    },
    onError: () => toast.error('Erreur lors de la validation KYC'),
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {user.firstName} {user.lastName}
            </h3>
            <Badge variant="warning">En attente</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Rôle : {user.role}
            {user.kycSubmittedAt && (
              <> · Soumis le {formatDate(user.kycSubmittedAt)}</>
            )}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {user.kycFrontDoc && (
              <a
                href={user.kycFrontDoc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ocean-600 dark:text-ocean-400 hover:underline"
              >
                <ExternalLink size={12} /> Recto
              </a>
            )}
            {user.kycBackDoc && (
              <a
                href={user.kycBackDoc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ocean-600 dark:text-ocean-400 hover:underline"
              >
                <ExternalLink size={12} /> Verso
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            loading={reviewMutation.isPending}
            onClick={() => reviewMutation.mutate({ status: 'APPROVED' })}
            leftIcon={<CheckCircle size={14} />}
          >
            Approuver
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={reviewMutation.isPending}
            onClick={() => setRejectOpen(true)}
            leftIcon={<XCircle size={14} />}
          >
            Refuser
          </Button>
        </div>
      </div>

      {rejectOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motif du refus
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            placeholder="Document illisible, expiré, informations incohérentes…"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={reviewMutation.isPending}
              disabled={!rejectionReason.trim()}
              onClick={() => reviewMutation.mutate({ status: 'REJECTED', rejectionReason: rejectionReason.trim() })}
            >
              Confirmer le refus
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const AdminKyc: React.FC = () => {
  const { data: pending = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'kyc', 'pending'],
    queryFn: kycApi.getPendingUsers,
    staleTime: 30 * 1000,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ShieldCheck size={22} className="text-ocean-600" />
          Vérifications d&apos;identité (KYC)
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {pending.length} demande(s) en attente de validation
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border p-8 text-center text-red-500 text-sm">
          Impossible de charger les demandes KYC.
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <ShieldCheck size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune vérification en attente.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((user) => (
            <KycCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminKyc
