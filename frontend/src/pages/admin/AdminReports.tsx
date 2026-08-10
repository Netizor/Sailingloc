import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminListReports, adminUpdateReport } from '../../api/reports.api'
import type { Report } from '../../api/reports.api'
import { formatDate } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const REASON_LABELS: Record<string, string> = {
  INAPPROPRIATE_CONTENT: 'Inappropriate content',
  FRAUD:                 'Fraud',
  DUPLICATE:             'Duplicate listing',
  WRONG_CATEGORY:        'Wrong category',
  OTHER:                 'Other',
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'warning' | 'success' | 'default' }> = {
  PENDING:   { label: 'Pending',   icon: <Clock size={12} />,       variant: 'warning' },
  PROCESSED: { label: 'Processed', icon: <CheckCircle size={12} />, variant: 'success' },
  DISMISSED: { label: 'Dismissed', icon: <XCircle size={12} />,     variant: 'default' },
  RESOLVED:  { label: 'Processed', icon: <CheckCircle size={12} />, variant: 'success' },
}

const PAGE_SIZE = 15

const AdminReports: React.FC = () => {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', { page, status: statusFilter }],
    queryFn: () => adminListReports({ page, limit: PAGE_SIZE, status: statusFilter || undefined }),
    staleTime: 30 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof adminUpdateReport>[1] }) =>
      adminUpdateReport(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] })
    },
    onError: () => toast.error('Error updating report'),
  })

  const reports: Report[]  = data?.data ?? []
  const total              = data?.total ?? 0
  const totalPages         = data?.totalPages ?? 1

  const handleProcess = (report: Report) => {
    updateMutation.mutate(
      { id: report.id, payload: { status: 'PROCESSED' } },
      { onSuccess: () => toast.success('Report marked as processed') },
    )
  }

  const handleDismiss = (report: Report) => {
    updateMutation.mutate(
      { id: report.id, payload: { status: 'DISMISSED' } },
      { onSuccess: () => toast.success('Report dismissed') },
    )
  }

  return (
    <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Flag size={22} className="text-red-500" />
            Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} report(s)</p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-6">
          {[
            { value: '',          label: 'All' },
            { value: 'PENDING',   label: 'Pending' },
            { value: 'PROCESSED', label: 'Processed' },
            { value: 'DISMISSED', label: 'Dismissed' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-brand-blue text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-ocean-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
              No reports found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    {['Listing', 'Reported by', 'Reason', 'Details', 'Status', 'Date', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {reports.map((report) => {
                    const sc = STATUS_CONFIG[report.status] ?? STATUS_CONFIG['PENDING']
                    return (
                      <tr key={report.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[160px] truncate">
                          {report.boatTitle}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {report.reporterName}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {REASON_LABELS[report.reason] ?? report.reason}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[180px] truncate text-xs italic">
                          {report.details ?? ''}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={sc.variant} size="sm">
                            {sc.icon}
                            {sc.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {report.status === 'PENDING' && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleProcess(report)}
                                loading={updateMutation.isPending}
                                leftIcon={<CheckCircle size={12} />}
                              >
                                Processed
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(report)}
                                loading={updateMutation.isPending}
                              >
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              <ChevronLeft size={15} className="mr-1" /> Previous
            </Button>
            <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              Next <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        )}
    </div>
  )
}

export default AdminReports
