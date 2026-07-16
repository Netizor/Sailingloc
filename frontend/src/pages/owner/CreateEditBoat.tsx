import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BoatStatus, BoatType, MotorizationType, type RequiredLicense } from '../../types'
import { BOAT_TYPE_LABELS, MOTORIZATION_LABELS } from '../../lib/labels'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  Upload,
  Plus,
  X,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { boatsApi } from '../../api/boats.api'
import type { Boat } from '../../types'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import BlockedModal from '../../components/ui/BlockedModal'
import { useProfileCompletion } from '../../hooks/useProfileCompletion'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

const STEP_KEYS = ['basic', 'location', 'pricing', 'equipment', 'media'] as const

interface BoatFormData {
  // Step 1
  title: string
  type: string
  manufacturer: string
  model: string
  year: string
  length: string
  capacity: string
  cabins: string
  // Step 2
  port: string
  city: string
  country: string
  motorizationType: string
  // Step 3
  dailyRate: string
  weeklyRate: string
  depositAmount: string
  withSkipper: boolean
  skipperPrice: string
  requiredLicense: RequiredLicense
  // Step 4
  description: string
  equipment: string[]
  rules: string
  welcomeMessage: string
  // Step 5
  images: string[]
  documents: string[]
}

const emptyForm: BoatFormData = {
  title: '',
  type: 'SAILBOAT',
  manufacturer: '',
  model: '',
  year: '',
  length: '',
  capacity: '',
  cabins: '',
  port: '',
  city: '',
  country: 'France',
  motorizationType: '',
  dailyRate: '',
  weeklyRate: '',
  depositAmount: '',
  withSkipper: false,
  skipperPrice: '',
  requiredLicense: 'NONE',
  description: '',
  equipment: [],
  rules: '',
  welcomeMessage: '',
  images: [],
  documents: [],
}

const CreateEditBoat: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEditing = !!id
  const { canManageBoat, issues } = useProfileCompletion()

  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<BoatFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof BoatFormData, string>>>({})
  const [equipmentInput, setEquipmentInput] = useState('')
  const [imageInput, setImageInput] = useState('')
  // Règles de réduction dégressive (E2) - gérées séparément car structure complexe
  const [discountRules, setDiscountRules] = useState<{ minDays: string; discountPercent: string }[]>([])
  // Upload documents (E5)
  const insuranceRef  = useRef<HTMLInputElement>(null)
  const registrationRef = useRef<HTMLInputElement>(null)
  const licenseRef    = useRef<HTMLInputElement>(null)
  const contractRef   = useRef<HTMLInputElement>(null)
  const [uploadingDoc, setUploadingDoc] = useState<'insurance' | 'registration' | 'license' | 'contract' | null>(null)
  const [pendingDocs, setPendingDocs] = useState<Partial<Record<'insurance' | 'registration' | 'license' | 'contract', File>>>({})

  const draftKey = isEditing ? `sailingloc_boat_draft_${id}` : 'sailingloc_boat_draft_new'
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const steps = STEP_KEYS.map((key, index) => ({
    number: index + 1,
    title: t(`createEditBoat.steps.${key}`),
  }))

  const handleDocUpload = useCallback(async (
    docType: 'insurance' | 'registration' | 'license' | 'contract',
    file: File,
  ) => {
    if (!id) return
    setUploadingDoc(docType)
    try {
      await boatsApi.uploadDocument(Number(id), docType, file)
      await qc.invalidateQueries({ queryKey: ['boat', id] })
      toast.success(t('createEditBoat.docUploaded'))
    } catch {
      toast.error(t('createEditBoat.docUploadError'))
    } finally {
      setUploadingDoc(null)
    }
  }, [id, qc, t])

  const handleDocSelect = useCallback((
    docType: 'insurance' | 'registration' | 'license' | 'contract',
    file: File,
  ) => {
    if (id) {
      handleDocUpload(docType, file)
    } else {
      setPendingDocs((prev) => ({ ...prev, [docType]: file }))
    }
  }, [id, handleDocUpload])

  // Load existing boat data
  const { data: boatData, isLoading: isLoadingBoat } = useQuery({
    queryKey: ['boat', id],
    queryFn: () => boatsApi.getById(Number(id!)),
    enabled: isEditing,
  })

  useEffect(() => {
    if (!boatData) return
    setForm({
      title: boatData.title ?? '',
      type: boatData.type ?? 'SAILBOAT',
      manufacturer: boatData.manufacturer ?? '',
      model: boatData.model ?? '',
      year: boatData.year ? String(boatData.year) : '',
      length: boatData.length ? String(boatData.length) : '',
      capacity: boatData.capacity ? String(boatData.capacity) : '',
      cabins: boatData.cabins ? String(boatData.cabins) : '',
      port: boatData.port ?? '',
      city: boatData.city ?? '',
      country: boatData.country ?? 'France',
      motorizationType: boatData.motorizationType ?? '',
      dailyRate: boatData.dailyRate ? String(boatData.dailyRate) : '',
      weeklyRate: boatData.weeklyRate ? String(boatData.weeklyRate) : '',
      depositAmount: boatData.depositAmount ? String(boatData.depositAmount) : '',
      withSkipper: boatData.withSkipper ?? false,
      skipperPrice: boatData.skipperPrice ? String(boatData.skipperPrice) : '',
      requiredLicense: (boatData.requiredLicense as RequiredLicense) || 'NONE',
      description: boatData.description ?? '',
      equipment: boatData.equipment ?? [],
      rules: boatData.rules ?? '',
      welcomeMessage: boatData.welcomeMessage ?? '',
      images: boatData.images ?? [],
      documents: [],
    })
    setDiscountRules(
      (boatData.discountRules ?? []).map((r) => ({
        minDays: String(r.minDays),
        discountPercent: String(r.discountPercent),
      }))
    )
  }, [boatData])

  // Restore draft (create mode only - en édition les données serveur font foi)
  useEffect(() => {
    if (isEditing) return
    try {
      const raw = localStorage.getItem('sailingloc_boat_draft_new')
      if (!raw) return
      const saved = JSON.parse(raw)
      if (!saved.form?.title) return // ne restaure pas un brouillon vide
      setForm(saved.form)
      if (saved.discountRules) setDiscountRules(saved.discountRules)
      if (saved.savedAt) setSavedAt(new Date(saved.savedAt))
    } catch {}
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave dans localStorage (debounce 800 ms)
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        const now = new Date()
        localStorage.setItem(draftKey, JSON.stringify({ form, discountRules, savedAt: now.toISOString() }))
        setSavedAt(now)
      } catch {}
    }, 800)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [form, discountRules, draftKey])

  const saveMutation = useMutation({
    mutationFn: async (params: { data: Partial<Boat>; publish: boolean }) => {
      const payload = {
        ...params.data,
        status: params.publish ? BoatStatus.ACTIVE : BoatStatus.DRAFT,
      }
      const boat = isEditing
        ? await boatsApi.update(Number(id!), payload)
        : await boatsApi.create(payload)

      if (!isEditing && Object.keys(pendingDocs).length > 0) {
        for (const [docType, file] of Object.entries(pendingDocs)) {
          if (file) {
            await boatsApi.uploadDocument(
              boat.id,
              docType as 'insurance' | 'registration' | 'license' | 'contract',
              file,
            )
          }
        }
      }
      return boat
    },
    onSuccess: (boat, variables) => {
      try { localStorage.removeItem(draftKey) } catch {}
      setSavedAt(null)
      toast.success(
        variables.publish ? t('createEditBoat.published') : t('createEditBoat.draftSaved')
      )
      if (!isEditing && Object.keys(pendingDocs).length > 0) {
        navigate(`/proprietaire/bateaux/${boat.id}/editer`)
      } else {
        navigate('/proprietaire/bateaux')
      }
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t('createEditBoat.saveError'))
    },
  })

  const setField = <K extends keyof BoatFormData>(key: K, value: BoatFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validateStep = (): boolean => {
    const e: typeof errors = {}
    if (step === 1) {
      if (!form.title.trim()) e.title = t('createEditBoat.validation.titleRequired')
      if (!form.type) e.type = t('createEditBoat.validation.typeRequired')
      if (!form.capacity || Number(form.capacity) < 1) e.capacity = t('createEditBoat.validation.capacityRequired')
    }
    if (step === 2) {
      if (!form.port.trim()) e.port = t('createEditBoat.validation.portRequired')
      if (!form.city.trim()) e.city = t('createEditBoat.validation.cityRequired')
    }
    if (step === 3) {
      if (!form.dailyRate || Number(form.dailyRate) <= 0) e.dailyRate = t('createEditBoat.validation.dailyRateRequired')
    }
    if (step === 4) {
      if (!form.description.trim()) e.description = 'La description est requise'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, steps.length))
  }
  const goPrev = () => setStep((s) => Math.max(s - 1, 1))

  const buildPayload = (): Partial<Boat> => ({
    title: form.title,
    type: form.type as Boat['type'],
    manufacturer: form.manufacturer || undefined,
    model: form.model || undefined,
    year: form.year ? Number(form.year) : undefined,
    length: form.length ? Number(form.length) : undefined,
    capacity: form.capacity ? Number(form.capacity) : undefined,
    cabins: form.cabins !== '' ? Number(form.cabins) : undefined,
    port: form.port,
    city: form.city,
    country: form.country,
    motorizationType: (form.motorizationType as MotorizationType) || undefined,
    dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
    weeklyRate: form.weeklyRate ? Number(form.weeklyRate) : undefined,
    depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
    withSkipper: form.withSkipper,
    skipperPrice: form.skipperPrice ? Number(form.skipperPrice) : undefined,
    requiredLicense: form.requiredLicense,
    description: form.description || undefined,
    equipment: form.equipment,
    rules: form.rules || undefined,
    welcomeMessage: form.welcomeMessage || undefined,
    discountRules: discountRules.length > 0
      ? discountRules
          .filter((r) => r.minDays && r.discountPercent)
          .map((r) => ({ minDays: Number(r.minDays), discountPercent: Number(r.discountPercent) }))
      : undefined,
    images: form.images,
    // Les documents sont gérés via des endpoints dédiés (/boats/:id/documents)
  })

  const handleSave = (publish: boolean) => {
    if (publish && !form.description.trim()) {
      setStep(4)
      setErrors(e => ({ ...e, description: 'La description est requise avant de publier' }))
      return
    }
    saveMutation.mutate({ data: buildPayload(), publish })
  }

  const addEquipment = () => {
    const item = equipmentInput.trim()
    if (item && !form.equipment.includes(item)) {
      setField('equipment', [...form.equipment, item])
      setEquipmentInput('')
    }
  }

  const removeEquipment = (item: string) => {
    setField('equipment', form.equipment.filter((e) => e !== item))
  }

  const addImage = () => {
    const url = imageInput.trim()
    if (url && !form.images.includes(url)) {
      setField('images', [...form.images, url])
      setImageInput('')
    }
  }

  if (isEditing && isLoadingBoat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Modale bloquante si le profil est incomplet - la page reste visible en arrière-plan flouté */}
      {!canManageBoat && <BlockedModal issues={issues} />}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          {isEditing ? t('createEditBoat.editTitle') : t('createEditBoat.addTitle')}
        </h1>

        {/* Progress stepper */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center flex-shrink-0">
                <button
                  onClick={() => step > s.number && setStep(s.number)}
                  disabled={step < s.number}
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    step > s.number
                      ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                      : step === s.number
                      ? 'bg-ocean-700 text-white ring-4 ring-ocean-100'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  )}
                >
                  {step > s.number ? <Check size={16} /> : s.number}
                </button>
                <span
                  className={cn(
                    'text-[10px] sm:text-xs mt-1.5 text-center max-w-[55px] sm:max-w-[80px] leading-tight',
                    step === s.number ? 'text-ocean-700 dark:text-ocean-400 font-semibold' : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mt-[-12px] min-w-4',
                    step > s.number ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {t('createEditBoat.stepLabel', { step, title: steps[step - 1].title })}
          </h2>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <Input
                label={t('createEditBoat.fields.title')}
                placeholder={t('createEditBoat.fields.titlePlaceholder')}
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                error={errors.title}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('createEditBoat.fields.boatType')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                >
                  {(Object.entries(BOAT_TYPE_LABELS) as [BoatType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('createEditBoat.fields.manufacturer')}
                  placeholder={t('createEditBoat.fields.manufacturerPlaceholder')}
                  value={form.manufacturer}
                  onChange={(e) => setField('manufacturer', e.target.value)}
                />
                <Input
                  label={t('createEditBoat.fields.model')}
                  placeholder={t('createEditBoat.fields.modelPlaceholder')}
                  value={form.model}
                  onChange={(e) => setField('model', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Input
                  label={t('createEditBoat.fields.year')}
                  type="number"
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={form.year}
                  onChange={(e) => setField('year', e.target.value)}
                />
                <Input
                  label={t('createEditBoat.fields.length')}
                  type="number"
                  placeholder="12.5"
                  min="0"
                  step="0.1"
                  value={form.length}
                  onChange={(e) => setField('length', e.target.value)}
                />
                <Input
                  label="Capacité (pers.)"
                  type="number"
                  placeholder="8"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setField('capacity', e.target.value)}
                  error={errors.capacity}
                  required
                />
              </div>
              <Input
                label="Nombre de cabines"
                type="number"
                placeholder="3"
                min="0"
                value={form.cabins}
                onChange={(e) => setField('cabins', e.target.value)}
              />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <Input
                label="Port d'attache"
                placeholder="Port de Marseille"
                value={form.port}
                onChange={(e) => setField('port', e.target.value)}
                error={errors.port}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ville"
                  placeholder="Marseille"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  error={errors.city}
                  required
                />
                <Input
                  label="Pays"
                  placeholder="France"
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Motorisation</label>
                <select
                  value={form.motorizationType}
                  onChange={(e) => setField('motorizationType', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white dark:bg-gray-700"
                >
                  <option value="">-- Choisir --</option>
                  {(Object.entries(MOTORIZATION_LABELS) as [MotorizationType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <Input
                label="Tarif journalier (€)"
                type="number"
                min="0"
                placeholder="200"
                value={form.dailyRate}
                onChange={(e) => setField('dailyRate', e.target.value)}
                error={errors.dailyRate}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tarif hebdomadaire (€)"
                  type="number"
                  min="0"
                  placeholder="1200"
                  value={form.weeklyRate}
                  onChange={(e) => setField('weeklyRate', e.target.value)}
                  helperText="Optionnel - réduction automatique"
                />
                <Input
                  label="Caution (€)"
                  type="number"
                  min="0"
                  placeholder="1500"
                  value={form.depositAmount}
                  onChange={(e) => setField('depositAmount', e.target.value)}
                />
              </div>

              {/* Skipper toggle */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.withSkipper}
                    onChange={(e) => setField('withSkipper', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-ocean-600 focus:ring-ocean-500"
                  />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">Proposer un skipper</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Vous ou un skipper professionnel conduisez le bateau.
                    </p>
                  </div>
                </label>
                {form.withSkipper && (
                  <div className="mt-4 pl-7">
                    <Input
                      label="Prix du skipper (€/jour)"
                      type="number"
                      min="0"
                      placeholder="150"
                      value={form.skipperPrice}
                      onChange={(e) => setField('skipperPrice', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {!form.withSkipper && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Permis requis pour le locataire
                  </label>
                  <select
                    value={form.requiredLicense}
                    onChange={(e) => setField('requiredLicense', e.target.value as RequiredLicense)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white dark:bg-gray-700"
                  >
                    <option value="NONE">Aucun permis requis</option>
                    <option value="COASTAL">Permis côtier (mer)</option>
                    <option value="OFFSHORE">Permis hauturier</option>
                    <option value="INLAND">Permis eaux intérieures</option>
                  </select>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Le locataire devra renseigner ses qualifications nautiques ou un permis vérifié dans son profil.
                  </p>
                </div>
              )}

              {/* Réductions dégressive (E2) */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">Réductions longue durée</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Appliquez une remise automatique selon le nombre de jours réservés.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDiscountRules((prev) => [...prev, { minDays: '', discountPercent: '' }])}
                    className="text-xs font-medium text-ocean-700 dark:text-ocean-400 hover:underline"
                  >
                    + Ajouter
                  </button>
                </div>
                {discountRules.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">Aucune règle de réduction.</p>
                )}
                <div className="flex flex-col gap-2">
                  {discountRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">À partir de</span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="7"
                        value={rule.minDays}
                        onChange={(e) => {
                          const next = [...discountRules]
                          next[idx] = { ...next[idx], minDays: e.target.value }
                          setDiscountRules(next)
                        }}
                        className="w-16 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">jours →</span>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        placeholder="10"
                        value={rule.discountPercent}
                        onChange={(e) => {
                          const next = [...discountRules]
                          next[idx] = { ...next[idx], discountPercent: e.target.value }
                          setDiscountRules(next)
                        }}
                        className="w-16 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">% de remise</span>
                      <button
                        type="button"
                        onClick={() => setDiscountRules((prev) => prev.filter((_, i) => i !== idx))}
                        className="ml-auto text-gray-300 hover:text-red-400 transition-colors"
                        aria-label="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Décrivez votre bateau, ses atouts, les zones de navigation conseillées…"
                  rows={5}
                  className={cn(
                    'w-full border rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none',
                    errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Equipment tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Équipements</label>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input
                    type="text"
                    value={equipmentInput}
                    onChange={(e) => setEquipmentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEquipment() } }}
                    placeholder="GPS, Radar, VHF…"
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  />
                  <Button variant="secondary" size="sm" onClick={addEquipment} leftIcon={<Plus size={13} />}>
                    Ajouter
                  </Button>
                </div>
                {form.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.equipment.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400 border border-ocean-100 dark:border-ocean-800 rounded-full px-3 py-1 text-sm"
                      >
                        {item}
                        <button
                          onClick={() => removeEquipment(item)}
                          className="hover:text-red-500 transition-colors"
                          aria-label={`Retirer ${item}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Règlement du bord</label>
                <textarea
                  value={form.rules}
                  onChange={(e) => setField('rules', e.target.value)}
                  placeholder="Non-fumeur à bord&#10;Animaux non acceptés&#10;Permis bateau côtier requis"
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Entrez une règle par ligne</p>
              </div>

              {/* Message de bienvenue automatique (E3) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message de bienvenue</label>
                <textarea
                  value={form.welcomeMessage}
                  onChange={(e) => setField('welcomeMessage', e.target.value)}
                  placeholder="Bonjour ! Votre réservation est confirmée. Vous trouverez le bateau à l'emplacement B12…"
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Ce message sera envoyé automatiquement au locataire lors de la confirmation du paiement.
                </p>
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="space-y-6">
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Photos du bateau
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Ajoutez des URLs d'images (Cloudinary, Unsplash, etc.) ou utilisez le widget
                  Cloudinary ci-dessous.
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }}
                    placeholder="https://res.cloudinary.com/…"
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  />
                  <Button variant="secondary" size="sm" onClick={addImage} leftIcon={<Plus size={13} />}>
                    Ajouter
                  </Button>
                </div>

                {form.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setField('images', form.images.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                            Principale
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center">
                    <Upload size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Aucune photo ajoutée</p>
                  </div>
                )}
              </div>

              {/* Documents officiels (E5) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Documents officiels
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Formats acceptés : PDF, JPEG, PNG, WebP.{' '}
                  {!isEditing && (
                    <span className="text-ocean-600">Les fichiers seront envoyés à la sauvegarde du bateau.</span>
                  )}
                </p>
                <div className="flex flex-col gap-3">
                  {([
                    { label: 'Assurance',        docType: 'insurance'    as const, ref: insuranceRef,    current: boatData?.insuranceDoc },
                    { label: 'Immatriculation',  docType: 'registration' as const, ref: registrationRef, current: boatData?.registrationDoc },
                    { label: 'Permis de navigation', docType: 'license'  as const, ref: licenseRef,      current: boatData?.licenseScanDoc },
                    { label: 'Contrat de location',  docType: 'contract' as const, ref: contractRef,     current: boatData?.contractDoc },
                  ]).map(({ label, docType, ref, current }) => (
                    <div key={docType} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
                      <FileText size={18} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                        {current ? (
                          <a
                            href={current}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-ocean-600 dark:text-ocean-400 flex items-center gap-1 hover:underline truncate"
                          >
                            <ExternalLink size={11} /> Voir le document
                          </a>
                        ) : pendingDocs[docType] ? (
                          <p className="text-xs text-green-600 dark:text-green-400 truncate">
                            Prêt : {pendingDocs[docType]!.name}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500">Non renseigné</p>
                        )}
                      </div>
                      <>
                        <input
                          ref={ref}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleDocSelect(docType, file)
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={uploadingDoc === docType}
                          onClick={() => ref.current?.click()}
                        >
                          {current || pendingDocs[docType] ? 'Remplacer' : 'Uploader'}
                        </Button>
                      </>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          {savedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
              Brouillon local sauvegardé à {savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <div className="flex items-center justify-between mt-4 pt-6 border-t border-gray-100 dark:border-gray-700 gap-3 flex-wrap">
            <div className="flex gap-2">
              {step > 1 && (
                <Button
                  variant="ghost"
                  onClick={goPrev}
                  leftIcon={<ChevronLeft size={16} />}
                >
                  {t('createEditBoat.prev')}
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                loading={saveMutation.isPending}
                leftIcon={<Save size={14} />}
              >
                {t('createEditBoat.saveDraft')}
              </Button>

              {step < steps.length ? (
                <Button
                  variant="primary"
                  onClick={goNext}
                  rightIcon={<ChevronRight size={16} />}
                >
                  {t('createEditBoat.next')}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => handleSave(true)}
                  loading={saveMutation.isPending}
                  leftIcon={<Check size={14} />}
                >
                  {t('createEditBoat.publish')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateEditBoat
