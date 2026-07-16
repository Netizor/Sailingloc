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
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [documentExpiresAt, setDocumentExpiresAt] = useState('')

  const reviewMutation = useMutation({
    mutationFn: (payload: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string; documentExpiresAt?: string }) =>
      kycApi.review(user.id, payload),
    onSuccess: (_, { status }) => {
      toast.success(status === 'APPROVED' ? 'Identity approved' : 'Identity rejected')
      setRejectOpen(false)
      setApproveOpen(false)
      setRejectionReason('')
      setDocumentExpiresAt('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc', 'pending'] })
    },
    onError: () => toast.error('Error during KYC validation'),
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {user.firstName} {user.lastName}
            </h3>
            <Badge variant="warning">Pending</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Role: {user.role}
            {user.kycSubmittedAt && (
              <> · Submitted on {formatDate(user.kycSubmittedAt)}</>
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
                <ExternalLink size={12} /> Front
              </a>
            )}
            {user.kycBackDoc && (
              <a
                href={user.kycBackDoc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ocean-600 dark:text-ocean-400 hover:underline"
              >
                <ExternalLink size={12} /> Back
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            loading={reviewMutation.isPending}
            onClick={() => { setApproveOpen(true); setRejectOpen(false) }}
            leftIcon={<CheckCircle size={14} />}
          >
            Approve
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={reviewMutation.isPending}
            onClick={() => { setRejectOpen(true); setApproveOpen(false) }}
            leftIcon={<XCircle size={14} />}
          >
            Reject
          </Button>
        </div>
      </div>

      {approveOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Expiry date (shown on the document)
          </label>
          <input
            type="date"
            value={documentExpiresAt}
            onChange={(e) => setDocumentExpiresAt(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Read the date on the front or back of the ID / passport (often 10 or 15 years).
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({
                status: 'APPROVED',
                documentExpiresAt: documentExpiresAt || undefined,
              })}
            >
              Confirm approval
            </Button>
          </div>
        </div>
      )}

      {rejectOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rejection reason
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            placeholder="Document unreadable, expired, inconsistent information…"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={reviewMutation.isPending}
              disabled={!rejectionReason.trim()}
              onClick={() => reviewMutation.mutate({ status: 'REJECTED', rejectionReason: rejectionReason.trim() })}
            >
              Confirm rejection
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
          Identity verifications (KYC)
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {pending.length} request(s) pending validation
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border p-8 text-center text-red-500 text-sm">
          Unable to load KYC requests.
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <ShieldCheck size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No pending verifications.</p>
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
