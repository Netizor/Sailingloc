import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck, UserX, Shield, User as UserIcon, Ship, Eye, X, FileCheck, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import { formatDate } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { BadgeVariant } from '../../components/ui/Badge'
import type { User } from '../../types'
import toast from 'react-hot-toast'

// Backend adds boatsCount to the admin payload; not on the base User interface
interface AdminUser extends User {
  boatsCount?: number
}

const roleConfig: Record<string, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  ADMIN: { label: 'Admin', variant: 'danger', icon: <Shield size={11} /> },
  OWNER: { label: 'Owner', variant: 'primary', icon: <Ship size={11} /> },
  RENTER: { label: 'Renter', variant: 'default', icon: <UserIcon size={11} /> },
}

function kycStatusLabel(status?: string) {
  switch (status) {
    case 'APPROVED': return 'Verified'
    case 'PENDING': return 'Pending'
    case 'REJECTED': return 'Renewal required / rejected'
    default: return 'Not submitted'
  }
}

function kycStatusVariant(status?: string): BadgeVariant {
  switch (status) {
    case 'APPROVED': return 'success'
    case 'PENDING': return 'warning'
    case 'REJECTED': return 'danger'
    default: return 'default'
  }
}

function isKycDocumentExpired(expiresAt?: string | null) {
  if (!expiresAt) return false
  const expiry = new Date(expiresAt)
  expiry.setHours(23, 59, 59, 999)
  return expiry.getTime() < Date.now()
}

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [sailorCvRejectionReason, setSailorCvRejectionReason] = useState('')
  const [kycRenewalReason, setKycRenewalReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, roleFilter }],
    queryFn: () => adminApi.getUsers({ search: search || undefined, role: roleFilter === 'ALL' ? undefined : roleFilter }),
    staleTime: 60 * 1000,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: number; active: boolean }) =>
      adminApi.setUserActive(userId, active),
    onSuccess: (_, { active }) => {
      toast.success(active ? 'Account activated' : 'Account suspended')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => toast.error('Error'),
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      adminApi.setUserRole(userId, role),
    onSuccess: () => {
      toast.success('Role updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => toast.error('Error'),
  })

  const reviewSailorCvMutation = useMutation({
    mutationFn: ({ userId, status, rejectionReason }: { userId: number; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
      adminApi.reviewSailorCv(userId, { status, rejectionReason }),
    onSuccess: () => {
      toast.success('Sailor CV status updated')
      setSailorCvRejectionReason('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', selectedUserId] })
    },
    onError: () => toast.error('Error validating sailor CV'),
  })

  const requestKycRenewalMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      adminApi.requestKycRenewal(userId, reason),
    onSuccess: () => {
      toast.success('Renewal request sent to the user')
      setKycRenewalReason('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', selectedUserId] })
    },
    onError: () => toast.error('Error requesting renewal'),
  })

  const { data: userDetail } = useQuery({
    queryKey: ['admin', 'user', selectedUserId],
    queryFn: () => adminApi.getUser(selectedUserId!),
    enabled: selectedUserId != null,
  })

  const users: AdminUser[] = data?.users ?? []

  return (
    <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{data?.total ?? 0} user(s)</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white dark:bg-gray-700"
          >
            <option value="ALL">All roles</option>
            <option value="RENTER">Renters</option>
            <option value="OWNER">Owners</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    {['User', 'Email', 'Role', 'Status', 'Sailor CV', 'Boats', 'Member since', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {users.map((user: AdminUser) => {
                    const roleInfo = roleConfig[user.role] ?? roleConfig['RENTER']
                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        {/* Avatar + name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-ocean-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-[120px] sm:max-w-[180px] truncate">
                          {user.email}
                        </td>

                        {/* Role with change select */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <Badge variant={roleInfo.variant} size="sm">
                              {roleInfo.icon}
                              {roleInfo.label}
                            </Badge>
                            <select
                              value={user.role}
                              onChange={(e) =>
                                changeRoleMutation.mutate({ userId: user.id, role: e.target.value })
                              }
                              className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-1.5 py-1 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                              aria-label="Change role"
                            >
                              <option value="RENTER">Renter</option>
                              <option value="OWNER">Owner</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <Badge variant={user.isActive ? 'success' : 'danger'} size="sm" dot>
                            {user.isActive ? 'Active' : 'Suspended'}
                          </Badge>
                        </td>

                        <td className="px-5 py-4">
                          <Badge
                            variant={user.sailorCvStatus === 'APPROVED' ? 'success' : user.sailorCvStatus === 'PENDING' ? 'warning' : user.sailorCvStatus === 'REJECTED' ? 'danger' : 'default'}
                            size="sm"
                          >
                            <FileCheck size={11} />
                            {user.sailorCvStatus === 'APPROVED' ? 'Verified' : user.sailorCvStatus === 'PENDING' ? 'To review' : user.sailorCvStatus === 'REJECTED' ? 'Rejected' : 'Not submitted'}
                          </Badge>
                        </td>

                        <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-center">
                          {user.boatsCount ?? 0}
                        </td>

                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Eye size={13} />}
                              onClick={() => setSelectedUserId(user.id)}
                            >
                              Details
                            </Button>
                            <Button
                              variant={user.isActive ? 'danger' : 'secondary'}
                              size="sm"
                              leftIcon={user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                              onClick={() =>
                                toggleActiveMutation.mutate({ userId: user.id, active: !user.isActive })
                              }
                              loading={toggleActiveMutation.isPending}
                            >
                              {user.isActive ? 'Block' : 'Unblock'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {selectedUserId && userDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedUserId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">User profile</h2>
              <button onClick={() => setSelectedUserId(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <p><span className="text-gray-500">Name:</span> <strong>{userDetail.firstName} {userDetail.lastName}</strong></p>
              <p><span className="text-gray-500">Email:</span> {userDetail.email}</p>
              <p><span className="text-gray-500">Role:</span> {userDetail.role}</p>
              <p><span className="text-gray-500">Phone:</span> {userDetail.phone ?? ''}</p>
              <p><span className="text-gray-500">Status:</span> {userDetail.isActive ? 'Active' : 'Blocked'}</p>
              <p><span className="text-gray-500">Joined:</span> {formatDate(userDetail.createdAt)}</p>
              {(userDetail as AdminUser).boatsCount != null && (
                <p><span className="text-gray-500">Boats:</span> {(userDetail as AdminUser).boatsCount}</p>
              )}

              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-ocean-600" />
                    ID document (KYC)
                  </p>
                  <Badge variant={kycStatusVariant(userDetail.kycStatus)} size="sm">
                    {kycStatusLabel(userDetail.kycStatus)}
                  </Badge>
                </div>

                {userDetail.kycSubmittedAt && (
                  <p><span className="text-gray-500">Submitted:</span> {formatDate(userDetail.kycSubmittedAt)}</p>
                )}
                {userDetail.kycReviewedAt && userDetail.kycStatus === 'APPROVED' && (
                  <p><span className="text-gray-500">Verified:</span> {formatDate(userDetail.kycReviewedAt)}</p>
                )}
                {userDetail.kycDocumentExpiresAt && (
                  <p>
                    <span className="text-gray-500">Valid until:</span>{' '}
                    <strong className={isKycDocumentExpired(userDetail.kycDocumentExpiresAt) ? 'text-red-600 dark:text-red-400' : ''}>
                      {formatDate(userDetail.kycDocumentExpiresAt)}
                    </strong>
                  </p>
                )}
                {userDetail.kycStatus === 'APPROVED' && isKycDocumentExpired(userDetail.kycDocumentExpiresAt) && (
                  <p className="flex items-start gap-2 text-amber-700 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    The validity date on the ID document has passed. Ask the user to renew it.
                  </p>
                )}
                {userDetail.kycRejectionReason && (
                  <p className="text-red-600 dark:text-red-400">Reason: {userDetail.kycRejectionReason}</p>
                )}

                <div className="flex flex-wrap gap-3">
                  {userDetail.kycFrontDoc && (
                    <a
                      href={userDetail.kycFrontDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-ocean-600 dark:text-ocean-400 hover:underline"
                    >
                      <ExternalLink size={12} /> Front
                    </a>
                  )}
                  {userDetail.kycBackDoc && (
                    <a
                      href={userDetail.kycBackDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-ocean-600 dark:text-ocean-400 hover:underline"
                    >
                      <ExternalLink size={12} /> Back
                    </a>
                  )}
                  {!userDetail.kycFrontDoc && !userDetail.kycBackDoc && (
                    <p className="text-gray-500">No document on file.</p>
                  )}
                </div>

                {(userDetail.kycStatus === 'APPROVED' || (userDetail.kycFrontDoc && userDetail.kycStatus !== 'PENDING')) && (
                  <div className="space-y-3">
                    <textarea
                      value={kycRenewalReason}
                      onChange={(e) => setKycRenewalReason(e.target.value)}
                      placeholder="E.g.: Your ID document expired on …, please submit a valid document."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      rows={2}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={requestKycRenewalMutation.isPending}
                      disabled={!kycRenewalReason.trim()}
                      onClick={() => requestKycRenewalMutation.mutate({
                        userId: userDetail.id,
                        reason: kycRenewalReason.trim(),
                      })}
                    >
                      Request a new document
                    </Button>
                  </div>
                )}
              </div>

              {(userDetail.role === 'OWNER' || userDetail.role === 'ADMIN') && (
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Sailor CV</p>
                    <Badge
                      variant={userDetail.sailorCvStatus === 'APPROVED' ? 'success' : userDetail.sailorCvStatus === 'PENDING' ? 'warning' : userDetail.sailorCvStatus === 'REJECTED' ? 'danger' : 'default'}
                      size="sm"
                    >
                      {userDetail.sailorCvStatus === 'APPROVED' ? 'Verified' : userDetail.sailorCvStatus === 'PENDING' ? 'To review' : userDetail.sailorCvStatus === 'REJECTED' ? 'Rejected' : 'Not submitted'}
                    </Badge>
                  </div>
                  {userDetail.sailorBio && (
                    <p><span className="text-gray-500">Bio:</span> {userDetail.sailorBio}</p>
                  )}
                  {userDetail.sailingQualifications && (
                    <p><span className="text-gray-500">Qualifications:</span> {userDetail.sailingQualifications}</p>
                  )}
                  {userDetail.sailingAreas && (
                    <p><span className="text-gray-500">Areas:</span> {userDetail.sailingAreas}</p>
                  )}
                  {userDetail.sailorCvDoc ? (
                    <a
                      href={userDetail.sailorCvDoc}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-ocean-700 dark:text-ocean-400 text-sm font-medium hover:underline"
                    >
                      View supporting document
                    </a>
                  ) : (
                    <p className="text-gray-500">No supporting document submitted.</p>
                  )}
                  {userDetail.sailorCvRejectionReason && (
                    <p className="text-red-600 dark:text-red-400">Reason: {userDetail.sailorCvRejectionReason}</p>
                  )}
                  {userDetail.sailorCvStatus === 'PENDING' && (
                    <div className="space-y-3">
                      <textarea
                        value={sailorCvRejectionReason}
                        onChange={(e) => setSailorCvRejectionReason(e.target.value)}
                        placeholder="Reason if rejecting..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        rows={2}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          leftIcon={<UserCheck size={13} />}
                          loading={reviewSailorCvMutation.isPending}
                          onClick={() => reviewSailorCvMutation.mutate({ userId: userDetail.id, status: 'APPROVED' })}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<UserX size={13} />}
                          loading={reviewSailorCvMutation.isPending}
                          disabled={!sailorCvRejectionReason.trim()}
                          onClick={() => reviewSailorCvMutation.mutate({ userId: userDetail.id, status: 'REJECTED', rejectionReason: sailorCvRejectionReason.trim() })}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
