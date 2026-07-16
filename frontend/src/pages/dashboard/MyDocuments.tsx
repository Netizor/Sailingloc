import React, { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield,
  FileText,
  Award,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  FileBadge,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { documentsApi, type DocumentsData } from '../../api/documents.api'
import { getMyBookingsAsOwner } from '../../api/bookings.api'
import { useAuthStore } from '../../store/auth.store'
import { UserRole } from '../../types'

const VESSEL_TYPES = ['Catamaran', 'Sailboat', 'Motorboat', 'RIB', 'Yacht', 'Zodiac']

function fileNameFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/')
    return decodeURIComponent(parts[parts.length - 1])
  } catch {
    return url.split('/').pop() ?? 'document'
  }
}

// ─── DocumentCard ──────────────────────────────────────────
interface DocumentCardProps {
  title: string
  subtitle?: string
  url?: string | null
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
}

function DocumentCard({ title, subtitle, url, onUpload, disabled }: DocumentCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center transition-all ${
        url
          ? 'border border-green-100 dark:border-green-800/40 bg-green-50/40 dark:bg-green-900/10'
          : 'border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-ocean-300 dark:hover:border-ocean-600 bg-white dark:bg-gray-800/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onUpload}
        disabled={disabled}
      />

      {url ? (
        <>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30">
            <FileBadge size={28} className="text-green-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 break-all line-clamp-2">
              {fileNameFromUrl(url)}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <CheckCircle2 size={13} className="text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                Valid and verified
              </span>
            </div>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline mt-1"
          >
            Replace
          </button>
        </>
      ) : (
        <>
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <UploadCloud size={28} className="text-gray-300 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">PDF · JPG · PNG</p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-1.5 bg-ocean-500 hover:bg-ocean-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <UploadCloud size={13} />
            {disabled ? 'Uploading…' : 'Add'}
          </button>
        </>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────
export default function MyDocuments() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isOwner = user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN

  const { data: docs = {} as DocumentsData, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.get,
  })

  const { data: bookingsData } = useQuery({
    queryKey: ['owner-bookings-confirmed'],
    queryFn: () => getMyBookingsAsOwner({ status: 'CONFIRMED', limit: 20 }),
    enabled: isOwner,
  })

  const [cvForm, setCvForm] = useState({
    yearsExperience: '',
    vesselTypes: [] as string[],
    navigationZones: '',
    certifications: '',
  })
  const [insuranceExpiry, setInsuranceExpiry] = useState('')

  useEffect(() => {
    if (docs.cvMarin) {
      setCvForm({
        yearsExperience: String(docs.cvMarin.yearsExperience ?? ''),
        vesselTypes: docs.cvMarin.vesselTypes ?? [],
        navigationZones: Array.isArray(docs.cvMarin.navigationZones)
          ? (docs.cvMarin.navigationZones as string[]).join(', ')
          : (docs.cvMarin.navigationZones as string) ?? '',
        certifications: Array.isArray(docs.cvMarin.certifications)
          ? (docs.cvMarin.certifications as string[]).join(', ')
          : (docs.cvMarin.certifications as string) ?? '',
      })
    }
    if (docs.insurance) {
      setInsuranceExpiry(docs.insurance.rcProExpiry ?? '')
    }
  }, [docs])

  const saveMutation = useMutation({
    mutationFn: ({ section, data }: { section: string; data: Record<string, unknown> }) =>
      documentsApi.saveSection(section, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Changes saved')
    },
    onError: () => toast.error('Error saving changes'),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, section, field }: { file: File; section: string; field: string }) =>
      documentsApi.upload(file, section, field),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document uploaded')
    },
    onError: () => toast.error('Error uploading document'),
  })

  const handleFileUpload =
    (section: string, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      uploadMutation.mutate({ file, section, field })
      e.target.value = ''
    }

  const handleSaveInsurance = () => {
    saveMutation.mutate({
      section: 'insurance',
      data: { rcProExpiry: insuranceExpiry || null },
    })
  }

  const handleSaveCv = () => {
    saveMutation.mutate({
      section: 'cvMarin',
      data: {
        yearsExperience: Number(cvForm.yearsExperience) || null,
        vesselTypes: cvForm.vesselTypes,
        navigationZones: cvForm.navigationZones,
        certifications: cvForm.certifications,
      },
    })
  }

  const toggleVesselType = (v: string) =>
    setCvForm((f) => ({
      ...f,
      vesselTypes: f.vesselTypes.includes(v)
        ? f.vesselTypes.filter((x) => x !== v)
        : [...f.vesselTypes, v],
    }))

  const isInsuranceExpired =
    !!docs.insurance?.rcProExpiry && new Date(docs.insurance.rcProExpiry) < new Date()

  const formatContractRef = (id: number) => {
    const year = new Date().getFullYear()
    return `#CTR-${year}-${String(id).padStart(3, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-ocean-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          My Documents & Certifications
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your identity documents, licenses, and insurance to keep your listings compliant.
        </p>
      </div>

      {/* ── Section 1: Identity & License ─────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <Shield size={18} className="text-ocean-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Identity & License
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DocumentCard
            title="ID document (front/back)"
            subtitle="National ID or passport"
            url={docs.identity?.frontUrl}
            onUpload={handleFileUpload('identity', 'frontUrl')}
            disabled={uploadMutation.isPending}
          />
          <DocumentCard
            title="Boating license"
            subtitle="Coastal or offshore license"
            url={docs.sailingLicense?.url}
            onUpload={handleFileUpload('sailingLicense', 'url')}
            disabled={uploadMutation.isPending}
          />
        </div>
      </div>

      {/* ── Section 2: Sailor CV ───────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <Award size={18} className="text-teal-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sailor CV</h2>
        </div>

        <div className="space-y-5">
          {/* Row 1: Experience + Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Years of experience
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={cvForm.yearsExperience}
                onChange={(e) => setCvForm((f) => ({ ...f, yearsExperience: e.target.value }))}
                className="w-24 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Vessel types mastered
              </label>
              <div className="flex flex-wrap gap-2">
                {VESSEL_TYPES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVesselType(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      cvForm.vesselTypes.includes(v)
                        ? 'bg-ocean-500 text-white border-ocean-500'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-ocean-300'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Zones + Certifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Usual sailing areas
              </label>
              <input
                type="text"
                value={cvForm.navigationZones}
                onChange={(e) => setCvForm((f) => ({ ...f, navigationZones: e.target.value }))}
                placeholder="Mediterranean (Corsica, French Riviera), Caribbean…"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Additional certifications
              </label>
              <input
                type="text"
                value={cvForm.certifications}
                onChange={(e) => setCvForm((f) => ({ ...f, certifications: e.target.value }))}
                placeholder="STCW 95, Restricted Radio Operator Certificate (CRR)…"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Insurance ───────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Insurance
            </h2>
          </div>
          {isInsuranceExpired && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full border border-red-100 dark:border-red-800/40">
              <AlertCircle size={12} />
              ACTION REQUIRED
            </span>
          )}
        </div>

        {/* RCP card */}
        <div
          className={`rounded-xl border p-5 flex flex-col sm:flex-row sm:items-start gap-4 ${
            isInsuranceExpired
              ? 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/5'
              : 'border-gray-100 dark:border-gray-700'
          }`}
        >
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Professional Liability Insurance
            </p>

            {isInsuranceExpired ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Your current certificate has expired. Please upload the new certificate
                for the current year to keep your listings active.
              </p>
            ) : docs.insurance?.rcProUrl ? (
              <a
                href={docs.insurance.rcProUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ocean-600 dark:text-ocean-400 hover:underline"
              >
                <FileText size={12} />
                View document
              </a>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">No document uploaded</p>
            )}

            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Expiry date
                </label>
                <input
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-400"
                />
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload('insurance', 'rcProUrl')}
                    disabled={uploadMutation.isPending}
                  />
                  <span className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer">
                    {docs.insurance?.rcProUrl ? 'Update' : 'Add'}
                  </span>
                </label>
                {insuranceExpiry !== (docs.insurance?.rcProExpiry ?? '') && (
                  <button
                    onClick={handleSaveInsurance}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Save date
                  </button>
                )}
              </div>
            </div>
          </div>

          {isInsuranceExpired && (
            <div className="shrink-0 p-3 bg-red-100 dark:bg-red-900/30 rounded-full self-center">
              <AlertCircle size={28} className="text-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Active contracts ───────────────────────── */}
      {isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <FileText size={18} className="text-purple-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Active contracts
            </h2>
          </div>

          {(bookingsData?.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              No active contracts
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {['Contract ref.', 'Boat / Renter', 'Period', 'Action'].map(
                      (col, i) => (
                        <th
                          key={col}
                          className={`text-xs font-medium text-gray-400 dark:text-gray-500 pb-3 ${
                            i === 3 ? 'text-right' : 'text-left pr-4'
                          }`}
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {(bookingsData?.data ?? []).map((b: any) => (
                    <tr key={b.id} className="group">
                      <td className="py-3 pr-4 font-mono text-xs font-medium text-gray-700 dark:text-gray-300">
                        {formatContractRef(b.id)}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {b.boat?.title ?? `Boat #${b.boatId}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {b.renter ? `${b.renter.firstName} ${b.renter.lastName}` : '-'}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {b.startDate
                          ? format(new Date(b.startDate), 'd MMM', { locale: enUS })
                          : '-'}
                        {' - '}
                        {b.endDate
                          ? format(new Date(b.endDate), 'd MMM yyyy', { locale: enUS })
                          : '-'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() =>
                            toast('PDF generation coming soon', { icon: '📄' })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-ocean-600 dark:text-ocean-400 hover:text-ocean-700 dark:hover:text-ocean-300 transition-colors"
                        >
                          <Download size={13} />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Save bar ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-end gap-3">
        <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
          Uploaded documents are saved automatically
        </p>
        <button
          onClick={handleSaveCv}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-brand-blue/20"
        >
          <Save size={16} />
          Save changes
        </button>
      </div>
    </div>
  )
}
