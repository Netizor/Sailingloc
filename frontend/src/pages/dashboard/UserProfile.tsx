import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  Anchor, Camera, Download, Eye, EyeOff, FileCheck, Lock, ShieldAlert,
  Trash2, Upload, UserCircle, Settings, Shield, ExternalLink, ChevronRight,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore } from '../../store/auth.store'
import { updateProfile, changePassword, uploadAvatar, uploadSailorCvDocument, exportMyData, deleteAccount } from '../../api/users.api'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getInitials, cn } from '../../lib/utils'
import { UserRole } from '../../types'
import { MY_PUBLIC_PROFILE_ROUTE, getPublicProfilePath } from '../../lib/profilePaths'

type SettingsTab = 'compte' | 'marin' | 'securite' | 'donnees'

// ─── Constantes partagées entre sections ─────────────────────────────────────

const MAX_AVATAR_SIZE  = 5 * 1024 * 1024                          // 5 Mo
const ALLOWED_TYPES    = ['image/jpeg', 'image/png', 'image/webp'] // Pas de SVG (XSS)
const MIN_PASSWORD_LEN = 12
const MAX_PASSWORD_LEN = 128

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AvatarSection: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updated) => {
      updateUser({ avatar: updated.avatar })
      toast.success('Photo de profil mise à jour')
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined
      toast.error(msg || 'Erreur lors du téléchargement de la photo')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation côté client pour un retour immédiat, miroir des règles backend
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format accepté : JPG, PNG ou WebP')
      e.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('La photo ne doit pas dépasser 5 Mo')
      e.target.value = ''
      return
    }

    mutation.mutate(file)
    // Réinitialise l'input pour permettre de re-sélectionner le même fichier
    e.target.value = ''
  }

  if (!user) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Photo de profil</h2>
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-ocean-100 dark:bg-ocean-800/40 flex items-center justify-center">
            {mutation.isPending ? (
              <Spinner size="md" />
            ) : user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-ocean-700 dark:text-ocean-400">
                {getInitials(user.firstName, user.lastName)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Camera size={15} />}
            disabled={mutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Changer la photo
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG ou WebP · Max 5 Mo</p>
        </div>

        {/* Type limité à la allowlist pour cohérence avec la validation */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}

// ─── Informations personnelles ────────────────────────────────────────────────

interface ProfileForm {
  firstName: string
  lastName:  string
  phone:     string
  bio:       string
}

const PersonalInfoSection: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState<ProfileForm>({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    phone:     user?.phone     ?? '',
    bio:       user?.bio       ?? '',
  })

  // Resynchronise le formulaire si l'identité de l'utilisateur change dans le store
  // (keyed sur user.id pour ne pas écraser les saisies en cours lors d'une simple mise à jour)
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName:  user.lastName,
        phone:     user.phone  ?? '',
        bio:       user.bio    ?? '',
      })
    }
  }, [user?.id])

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      updateUser({
        firstName: updated.firstName,
        lastName:  updated.lastName,
        phone:     updated.phone,
        bio:       updated.bio,
      })
      toast.success('Profil mis à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil')
    },
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      phone:     form.phone.trim(),
      bio:       form.bio.trim(),
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">
        Informations personnelles
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
          />
          <Input
            label="Nom"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Téléphone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="+33 6 12 34 56 78"
        />

        <Textarea
          label="Biographie"
          name="bio"
          rows={3}
          value={form.bio}
          onChange={handleChange}
          placeholder="Présentez-vous en quelques mots…"
        />

        <div className="flex justify-end pt-1">
          <Button type="submit" loading={mutation.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── CV de marin (propriétaire) ───────────────────────────────────────────────

interface SailorCvForm {
  sailingExperienceYears: string
  sailingQualifications:  string
  sailingAreas:           string
  sailorBio:              string
}

function sailorCvToForm(user: {
  sailingExperienceYears?: number | null
  sailingQualifications?: string | null
  sailingAreas?: string | null
  sailorBio?: string | null
}): SailorCvForm {
  return {
    sailingExperienceYears: user.sailingExperienceYears != null ? String(user.sailingExperienceYears) : '',
    sailingQualifications:  user.sailingQualifications ?? '',
    sailingAreas:           user.sailingAreas ?? '',
    sailorBio:              user.sailorBio ?? '',
  }
}

const SailorCvSection: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<SailorCvForm>(() => sailorCvToForm(user ?? {}))

  useEffect(() => {
    if (user) setForm(sailorCvToForm(user))
  }, [user?.id])

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      updateUser({
        sailingExperienceYears: updated.sailingExperienceYears,
        sailingQualifications:  updated.sailingQualifications,
        sailingAreas:           updated.sailingAreas,
        sailorBio:              updated.sailorBio,
      })
      setForm(sailorCvToForm(updated))
      queryClient.invalidateQueries({ queryKey: ['owner-profile', String(user?.id)] })
      queryClient.invalidateQueries({ queryKey: ['boat'] })
      toast.success('Informations enregistrées sur votre profil public.')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du CV de marin')
    },
  })

  const documentMutation = useMutation({
    mutationFn: uploadSailorCvDocument,
    onSuccess: (updated) => {
      updateUser({
        sailorCvStatus: updated.sailorCvStatus,
        sailorCvDoc: updated.sailorCvDoc,
        sailorCvSubmittedAt: updated.sailorCvSubmittedAt,
        sailorCvReviewedAt: updated.sailorCvReviewedAt,
        sailorCvRejectionReason: updated.sailorCvRejectionReason,
      })
      toast.success('Justificatif envoyé pour validation')
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du justificatif")
    },
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      sailingExperienceYears: form.sailingExperienceYears === '' ? null : Number(form.sailingExperienceYears),
      sailingQualifications:  form.sailingQualifications.trim(),
      sailingAreas:           form.sailingAreas.trim(),
      sailorBio:              form.sailorBio.trim(),
    })
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format accepté : PDF, JPG ou PNG')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le justificatif ne doit pas dépasser 5 Mo')
      e.target.value = ''
      return
    }
    documentMutation.mutate(file)
    e.target.value = ''
  }

  const status = user?.sailorCvStatus ?? 'NOT_SUBMITTED'
  const statusLabel = {
    NOT_SUBMITTED: 'Non vérifié',
    PENDING: 'En attente de validation',
    APPROVED: 'Vérifié par SailingLoc',
    REJECTED: 'Refusé',
  }[status]
  const statusClass = {
    NOT_SUBMITTED: 'bg-gray-50 text-gray-600 border-gray-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  }[status]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
        <Anchor size={18} className="text-ocean-700 dark:text-ocean-400" />
        CV de marin
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Ces informations sont affichées sur votre profil public et rassurent les locataires.
      </p>
      <div className="mb-5 space-y-2">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
          <FileCheck size={14} />
          {statusLabel}
        </div>
        {status === 'NOT_SUBMITTED' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enregistrer le formulaire sauvegarde vos informations sur votre profil public.
            Le statut « Vérifié » nécessite l&apos;envoi d&apos;un justificatif (permis, diplôme…) validé par SailingLoc.
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Années d'expérience en navigation"
          name="sailingExperienceYears"
          type="number"
          min={0}
          max={100}
          value={form.sailingExperienceYears}
          onChange={handleChange}
          placeholder="Ex : 12"
        />

        <Textarea
          label="Permis et qualifications"
          name="sailingQualifications"
          rows={2}
          value={form.sailingQualifications}
          onChange={handleChange}
          placeholder="Ex : Permis côtier, permis hauturier, certificat restreint de radiotéléphoniste…"
        />

        <Textarea
          label="Zones de navigation"
          name="sailingAreas"
          rows={2}
          value={form.sailingAreas}
          onChange={handleChange}
          placeholder="Ex : Méditerranée, Atlantique, Manche…"
        />

        <Textarea
          label="Présentation de marin"
          name="sailorBio"
          rows={4}
          value={form.sailorBio}
          onChange={handleChange}
          placeholder="Décrivez votre parcours de marin, vos navigations marquantes, votre approche…"
        />

        <div className="flex justify-end pt-1">
          <Button type="submit" loading={mutation.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>

      <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
          Justificatif pour validation
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Envoyez un permis, diplôme, certificat ou attestation nautique. Un admin SailingLoc pourra vérifier votre CV.
        </p>
        {user?.sailorCvRejectionReason && status === 'REJECTED' && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-3">
            Motif du refus : {user.sailorCvRejectionReason}
          </p>
        )}
        <input
          ref={documentInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={handleDocumentChange}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Upload size={14} />}
          loading={documentMutation.isPending}
          onClick={() => documentInputRef.current?.click()}
        >
          Envoyer un justificatif
        </Button>
      </div>
    </div>
  )
}

// ─── Sécurité ─────────────────────────────────────────────────────────────────

interface PasswordForm {
  currentPassword: string
  newPassword:     string
  confirmPassword: string
}

type VisibleField = 'current' | 'new' | 'confirm'

const SecuritySection: React.FC = () => {
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  })

  // Un seul état pour les trois toggles de visibilité - moins de boilerplate
  const [visible, setVisible] = useState<Record<VisibleField, boolean>>({
    current: false,
    new:     false,
    confirm: false,
  })
  const [fieldError, setFieldError] = useState('')

  const toggle = (field: VisibleField) =>
    setVisible((prev) => ({ ...prev, [field]: !prev[field] }))

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setFieldError('')
    },
    onError: (err: unknown) => {
      // Affiche le message serveur sous le champ (ex: mot de passe actuel incorrect)
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined
      setFieldError(msg ?? 'Erreur lors du changement de mot de passe')
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldError('')
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation côté client - miroir des règles backend pour un retour immédiat
    if (form.newPassword.length < MIN_PASSWORD_LEN) {
      setFieldError(
        `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères`,
      )
      return
    }
    if (form.newPassword.length > MAX_PASSWORD_LEN) {
      setFieldError(`Le mot de passe ne doit pas dépasser ${MAX_PASSWORD_LEN} caractères`)
      return
    }
    if (
      !/[A-Z]/.test(form.newPassword) ||
      !/[a-z]/.test(form.newPassword) ||
      !/[0-9]/.test(form.newPassword) ||
      !/[^A-Za-z0-9]/.test(form.newPassword)
    ) {
      setFieldError(
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
      )
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setFieldError('Les mots de passe ne correspondent pas')
      return
    }

    mutation.mutate({
      currentPassword: form.currentPassword,
      newPassword:     form.newPassword,
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
        <Lock size={16} className="text-gray-400 dark:text-gray-500" />
        Sécurité
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Mot de passe actuel"
          name="currentPassword"
          type={visible.current ? 'text' : 'password'}
          value={form.currentPassword}
          onChange={handleChange}
          error={fieldError || undefined}
          required
          rightIcon={visible.current ? <EyeOff size={16} /> : <Eye size={16} />}
          onRightIconClick={() => toggle('current')}
        />
        <Input
          label="Nouveau mot de passe"
          name="newPassword"
          type={visible.new ? 'text' : 'password'}
          value={form.newPassword}
          onChange={handleChange}
          helperText={`${MIN_PASSWORD_LEN}+ car. · majuscule · chiffre`}
          required
          rightIcon={visible.new ? <EyeOff size={16} /> : <Eye size={16} />}
          onRightIconClick={() => toggle('new')}
        />
        <Input
          label="Confirmer le nouveau mot de passe"
          name="confirmPassword"
          type={visible.confirm ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={handleChange}
          required
          rightIcon={visible.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
          onRightIconClick={() => toggle('confirm')}
        />
        <div className="flex justify-end pt-1">
          <Button type="submit" loading={mutation.isPending}>
            Changer le mot de passe
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Données & vie privée (RGPD) ──────────────────────────────────────────────

const DataPrivacySection: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()

  // État de la modale de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmEmail, setConfirmEmail]       = useState('')

  const exportMutation = useMutation({
    mutationFn: exportMyData,
    onSuccess: (data) => {
      // Déclenche le téléchargement du fichier JSON côté client
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `sailingloc-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export téléchargé')
    },
    onError: () => toast.error("Erreur lors de l'export"),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success('Compte supprimé. Vos données ont été effacées.')
      logout()
      navigate('/', { replace: true })
    },
    onError: () => toast.error('Erreur lors de la suppression du compte'),
  })

  const handleDelete = () => {
    if (confirmEmail !== user?.email) {
      toast.error('L\'adresse e-mail saisie ne correspond pas')
      return
    }
    deleteMutation.mutate()
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
        <ShieldAlert size={16} className="text-gray-400 dark:text-gray-500" />
        Données &amp; vie privée
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
        Conformément au RGPD, vous disposez d'un droit d'accès, de portabilité et d'effacement de vos données.
      </p>

      {/* Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Exporter mes données</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Téléchargez une copie de toutes vos données personnelles au format JSON.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download size={14} />}
          loading={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
        >
          Exporter
        </Button>
      </div>

      {/* Suppression de compte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5">
        <div>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Supprimer mon compte</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Action irréversible. Vos données personnelles seront anonymisées (Art. 17 RGPD).
          </p>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
        >
          <Trash2 size={14} />
          Supprimer
        </button>
      </div>

      {/* Modale de confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Supprimer mon compte
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cette action est <strong>irréversible</strong>. Vos données personnelles seront anonymisées.
              Pour confirmer, saisissez votre adresse e-mail : <strong>{user?.email}</strong>
            </p>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Votre adresse e-mail"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowDeleteModal(false); setConfirmEmail('') }}
                disabled={deleteMutation.isPending}
              >
                Annuler
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending || confirmEmail !== user?.email}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteMutation.isPending ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const UserProfile: React.FC = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('compte')

  if (!user) return null

  const isOwner = user.role === UserRole.OWNER || user.role === UserRole.ADMIN
  const publicProfilePath = getPublicProfilePath(user)

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; ownerOnly?: boolean }[] = [
    { id: 'compte', label: 'Mon compte', icon: <UserCircle size={18} /> },
    { id: 'marin', label: 'CV de marin', icon: <Anchor size={18} />, ownerOnly: true },
    { id: 'securite', label: 'Sécurité', icon: <Shield size={18} /> },
    { id: 'donnees', label: 'Confidentialité', icon: <Lock size={18} /> },
  ]

  const visibleTabs = tabs.filter((t) => !t.ownerOnly || isOwner)

  return (
    <div className="max-w-4xl">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ocean-700 via-brand-blue to-ocean-600 text-white p-6 sm:p-8 mb-6 shadow-lg shadow-ocean-700/20">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-bold">{getInitials(user.firstName, user.lastName)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isOwner ? <Settings size={18} className="opacity-80" /> : <UserCircle size={18} className="opacity-80" />}
              <h1 className="text-xl sm:text-2xl font-bold">{isOwner ? 'Paramètres' : 'Mon profil'}</h1>
            </div>
            <p className="text-sm text-white/80">
              {user.firstName} {user.lastName} · {user.email}
            </p>
          </div>
          {publicProfilePath && (
            <Link
              to={MY_PUBLIC_PROFILE_ROUTE}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-white text-ocean-700 hover:bg-white/90 rounded-xl px-4 py-2.5 transition-colors flex-shrink-0 shadow-sm"
            >
              <ExternalLink size={15} />
              Voir mon profil public
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation onglets */}
        <nav className="lg:w-52 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 -mx-1 px-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-brand-blue dark:text-ocean-400 shadow-sm border border-gray-100 dark:border-gray-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-800/50',
                )}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && <ChevronRight size={14} className="ml-auto hidden lg:block opacity-50" />}
              </button>
            ))}
          </div>
        </nav>

        {/* Contenu */}
        <div className="flex-1 min-w-0 space-y-4">
          {activeTab === 'compte' && (
            <>
              <AvatarSection />
              <PersonalInfoSection />
            </>
          )}
          {activeTab === 'marin' && isOwner && <SailorCvSection />}
          {activeTab === 'securite' && <SecuritySection />}
          {activeTab === 'donnees' && <DataPrivacySection />}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
