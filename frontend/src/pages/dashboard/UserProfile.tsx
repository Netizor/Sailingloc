import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Camera, Download, Eye, EyeOff, Lock, ShieldAlert, Trash2, UserCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore } from '../../store/auth.store'
import { updateProfile, changePassword, uploadAvatar, exportMyData, deleteAccount } from '../../api/users.api'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getInitials } from '../../lib/utils'

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
    onError: () => {
      toast.error('Erreur lors du téléchargement de la photo')
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

  // Un seul état pour les trois toggles de visibilité — moins de boilerplate
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

    // Validation côté client — miroir des règles backend pour un retour immédiat
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
      toast.success('Compte supprimé — vos données ont été effacées.')
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

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <UserCircle size={22} className="text-ocean-700 dark:text-ocean-400" />
          Mon profil
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Gérez vos informations personnelles et votre sécurité
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <AvatarSection />
        <PersonalInfoSection />
        <SecuritySection />
        <DataPrivacySection />
      </div>
    </div>
  )
}

export default UserProfile
