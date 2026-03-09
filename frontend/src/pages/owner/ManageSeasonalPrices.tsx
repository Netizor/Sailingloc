import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, X, Check, Tag, ArrowLeft, Info } from 'lucide-react'
import {
  getSeasonalPrices,
  createSeasonalPrice,
  updateSeasonalPrice,
  deleteSeasonalPrice,
} from '../../api/seasonalPrices.api'
import type { SeasonalPrice, SeasonalPricePayload } from '../../api/seasonalPrices.api'
import { getBoat } from '../../api/boats.api'
import type { Boat } from '../../types'
import { formatPrice } from '../../lib/utils'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

// ─── Formulaire inline ────────────────────────────────────────────────────────

interface FormState {
  label: string
  startDate: string
  endDate: string
  dailyRate: string
}

const EMPTY_FORM: FormState = { label: '', startDate: '', endDate: '', dailyRate: '' }

interface PriceFormProps {
  initial?: FormState
  onSubmit: (payload: SeasonalPricePayload) => void
  onCancel: () => void
  loading: boolean
}

const PriceForm: React.FC<PriceFormProps> = ({ initial = EMPTY_FORM, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState<FormState>(initial)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.label || !form.startDate || !form.endDate || !form.dailyRate) {
      toast.error('Tous les champs sont requis')
      return
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      toast.error('La date de début doit être antérieure à la date de fin')
      return
    }
    const rate = parseFloat(form.dailyRate)
    if (isNaN(rate) || rate <= 0) {
      toast.error('Le tarif journalier doit être un nombre positif')
      return
    }
    onSubmit({
      label: form.label,
      startDate: form.startDate,
      endDate: form.endDate,
      dailyRate: rate,
    })
  }

  const inputCls =
    'w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="bg-ocean-50/60 dark:bg-ocean-900/30 border border-ocean-100 dark:border-ocean-800 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Libellé de la période</label>
          <input
            type="text"
            value={form.label}
            onChange={set('label')}
            placeholder="Ex : Haute saison, Week-end, Juillet–Août…"
            className={inputCls}
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date de début</label>
          <input type="date" value={form.startDate} onChange={set('startDate')} className={`${inputCls} dark:[color-scheme:dark]`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date de fin</label>
          <input type="date" value={form.endDate} onChange={set('endDate')} className={`${inputCls} dark:[color-scheme:dark]`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tarif journalier (€)</label>
          <input
            type="number"
            value={form.dailyRate}
            onChange={set('dailyRate')}
            placeholder="Ex : 150"
            min="1"
            step="0.01"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel} leftIcon={<X size={14} />}>
          Annuler
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={loading} leftIcon={<Check size={14} />}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

// ─── Ligne d'un tarif ─────────────────────────────────────────────────────────

interface PriceRowProps {
  sp: SeasonalPrice
  onEdit: (sp: SeasonalPrice) => void
  onDelete: (id: number) => void
  deleting: boolean
}

const PriceRow: React.FC<PriceRowProps> = ({ sp, onEdit, onDelete, deleting }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{sp.label}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {new Date(sp.startDate).toLocaleDateString('fr-FR')} →{' '}
        {new Date(sp.endDate).toLocaleDateString('fr-FR')}
      </p>
    </div>
    <div className="flex-shrink-0">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-sm font-bold">
        <Tag size={12} />
        {formatPrice(sp.dailyRate)} / jour
      </span>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => onEdit(sp)}
        className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-ocean-600 dark:hover:text-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-900/30 transition-colors"
        aria-label="Modifier"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={() => onDelete(sp.id)}
        disabled={deleting}
        className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        aria-label="Supprimer"
      >
        <Trash2 size={15} />
      </button>
    </div>
  </div>
)

// ─── Page principale ───────────────────────────────────────────────────────────

const ManageSeasonalPrices: React.FC = () => {
  const { id: boatId } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<SeasonalPrice | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /* Informations du bateau (titre) */
  const { data: boatData } = useQuery<Boat>({
    queryKey: ['boat', boatId],
    queryFn: () => getBoat(Number(boatId!)),
    enabled: !!boatId,
  })

  /* Liste des prix saisonniers */
  const { data: prices = [], isLoading } = useQuery({
    queryKey: ['seasonal-prices', boatId],
    queryFn: () => getSeasonalPrices(Number(boatId!)),
    enabled: !!boatId,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['seasonal-prices', boatId] })

  const createMutation = useMutation({
    mutationFn: (payload: SeasonalPricePayload) => createSeasonalPrice(Number(boatId!), payload),
    onSuccess: () => {
      toast.success('Tarif ajouté')
      setShowForm(false)
      invalidate()
    },
    onError: () => toast.error("Erreur lors de l'ajout du tarif"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SeasonalPricePayload> }) =>
      updateSeasonalPrice(Number(boatId!), id, payload),
    onSuccess: () => {
      toast.success('Tarif mis à jour')
      setEditTarget(null)
      invalidate()
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSeasonalPrice(Number(boatId!), id),
    onSuccess: () => {
      toast.success('Tarif supprimé')
      setDeletingId(null)
      invalidate()
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const handleDelete = (id: number) => {
    if (!window.confirm('Supprimer ce tarif saisonnier ?')) return
    setDeletingId(id)
    deleteMutation.mutate(id)
  }

  const handleEditSubmit = (payload: SeasonalPricePayload) => {
    if (!editTarget) return
    updateMutation.mutate({ id: editTarget.id, payload })
  }

  const boatTitle = boatData?.title ?? 'ce bateau'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Header */}
        <div>
          <Link
            to="/proprietaire/bateaux"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-ocean-700 dark:hover:text-ocean-400 mb-4 transition-colors"
          >
            <ArrowLeft size={14} />
            Mes bateaux
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prix saisonniers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Définissez des tarifs spéciaux pour <span className="font-medium text-gray-700 dark:text-gray-300">{boatTitle}</span> selon les périodes.
          </p>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl text-sm text-blue-700 dark:text-blue-400">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <p>
            Les tarifs saisonniers remplacent le tarif de base du bateau pour les dates comprises dans
            la période définie. En cas de chevauchement, le premier tarif trouvé s'applique.
          </p>
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-3">
            {prices.length === 0 && !showForm && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 p-12 text-center">
                <Tag size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" strokeWidth={1.5} />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun tarif saisonnier défini pour ce bateau.</p>
              </div>
            )}

            {prices.map((sp) =>
              editTarget?.id === sp.id ? (
                <PriceForm
                  key={sp.id}
                  initial={{
                    label: sp.label,
                    startDate: sp.startDate,
                    endDate: sp.endDate,
                    dailyRate: String(sp.dailyRate),
                  }}
                  onSubmit={handleEditSubmit}
                  onCancel={() => setEditTarget(null)}
                  loading={updateMutation.isPending}
                />
              ) : (
                <PriceRow
                  key={sp.id}
                  sp={sp}
                  onEdit={setEditTarget}
                  onDelete={handleDelete}
                  deleting={deletingId === sp.id && deleteMutation.isPending}
                />
              )
            )}

            {/* Formulaire d'ajout */}
            {showForm && (
              <PriceForm
                onSubmit={(p) => createMutation.mutate(p)}
                onCancel={() => setShowForm(false)}
                loading={createMutation.isPending}
              />
            )}
          </div>
        )}

        {/* CTA ajouter */}
        {!showForm && !editTarget && (
          <div className="flex justify-center pt-2">
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
              leftIcon={<Plus size={16} />}
            >
              Ajouter une période
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageSeasonalPrices
