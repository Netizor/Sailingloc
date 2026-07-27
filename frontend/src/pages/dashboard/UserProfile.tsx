import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import {
  Anchor, Camera, Download, Eye, EyeOff, FileCheck, Lock, ShieldAlert,
  Trash2, Upload, UserCircle, Shield, ExternalLink, ChevronRight,
  CreditCard, PencilLine,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore } from '../../store/auth.store'
import { updateProfile, changePassword, uploadAvatar, uploadSailorCvDocument, exportMyData, deleteAccount } from '../../api/users.api'
import { stripeApi } from '../../api/stripe.api'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { getInitials, cn } from '../../lib/utils'
import { UserRole } from '../../types'
import { MY_PUBLIC_PROFILE_ROUTE, getPublicProfilePath } from '../../lib/profilePaths'

type SettingsTab = 'compte' | 'marin' | 'securite' | 'donnees' | 'confidentialite'

// ─── Constantes partagées entre sections ─────────────────────────────────────

const MAX_AVATAR_SIZE  = 5 * 1024 * 1024                          // 5 Mo
const ALLOWED_TYPES    = ['image/jpeg', 'image/png', 'image/webp'] // Pas de SVG (XSS)
const MIN_PASSWORD_LEN = 12
const MAX_PASSWORD_LEN = 128

// Style de carte partagé par toutes les sections du profil
const CARD = 'bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300'
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null

/** Icône de section dans un badge coloré, pour un en-tête plus moderne. */
const SectionIcon: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <div className="h-9 w-9 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center text-ocean-700 dark:text-ocean-400 flex-shrink-0">
    {icon}
  </div>
)

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AvatarSection: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updated) => {
      updateUser({ avatar: updated.avatar })
      toast.success('Profile photo updated')
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined
      toast.error(msg || 'Error uploading photo')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation côté client pour un retour immédiat, miroir des règles backend
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Accepted formats: JPG, PNG, or WebP')
      e.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Photo must not exceed 5 MB')
      e.target.value = ''
      return
    }

    mutation.mutate(file)
    // Réinitialise l'input pour permettre de re-sélectionner le même fichier
    e.target.value = ''
  }

  if (!user) return null

  return (
    <div className={CARD}>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-6">Profile photo</h2>
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-ocean-100 dark:bg-ocean-800/40 flex items-center justify-center ring-4 ring-ocean-50 dark:ring-ocean-900/40">
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
            Change photo
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
  const [isEditing, setIsEditing] = useState(false)
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
      toast.success('Profile updated')
    },
    onError: () => {
      toast.error('Error updating profile')
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
    }, {
      onSuccess: () => {
        setIsEditing(false)
      },
    })
  }

  return (
    <div className={CARD}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Personal information</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your visible and editable details in one place.</p>
        </div>
        {!isEditing && (
          <Button type="button" variant="secondary" size="sm" leftIcon={<PencilLine size={14} />} onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Full name</p>
            <p className="mt-1 text-sm text-gray-600">{user?.firstName} {user?.lastName}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Phone</p>
              <p className="mt-1 text-sm text-gray-600">{user?.phone || 'Not provided'}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Email</p>
              <p className="mt-1 text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Bio</p>
            <p className="mt-1 text-sm text-gray-600">{user?.bio || 'No bio added.'}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <Input label="Last name" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>

          <Input label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+33 6 12 34 56 78" />

          <Textarea label="Bio" name="bio" rows={3} value={form.bio} onChange={handleChange} placeholder="Tell us a bit about yourself…" />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setForm({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '', bio: user?.bio ?? '' }) }}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      )}
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
      toast.success('Details saved to your public profile.')
    },
    onError: () => {
      toast.error('Error updating sailor CV')
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
      toast.success('Supporting document submitted for review')
    },
    onError: () => {
      toast.error('Error uploading supporting document')
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
      toast.error('Accepted formats: PDF, JPG, or PNG')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Supporting document must not exceed 5 MB')
      e.target.value = ''
      return
    }
    documentMutation.mutate(file)
    e.target.value = ''
  }

  const status = user?.sailorCvStatus ?? 'NOT_SUBMITTED'
  const statusLabel = {
    NOT_SUBMITTED: 'Not verified',
    PENDING: 'Pending review',
    APPROVED: 'Verified by SailingLoc',
    REJECTED: 'Rejected',
  }[status]
  const statusClass = {
    NOT_SUBMITTED: 'bg-gray-50 text-gray-600 border-gray-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  }[status]

  return (
    <div className={CARD}>
      <div className="flex items-center gap-2.5 mb-1">
        <SectionIcon icon={<Anchor size={17} />} />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sailor CV</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 ml-[46px]">
        This information appears on your public profile and helps reassure renters.
      </p>
      <div className="mb-5 space-y-2">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
          <FileCheck size={14} />
          {statusLabel}
        </div>
        {status === 'NOT_SUBMITTED' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Saving the form updates your public profile.
            A &quot;Verified&quot; status requires submitting a supporting document (license, diploma…) reviewed by SailingLoc.
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Years of sailing experience"
          name="sailingExperienceYears"
          type="number"
          min={0}
          max={100}
          value={form.sailingExperienceYears}
          onChange={handleChange}
          placeholder="e.g. 12"
        />

        <Textarea
          label="Licenses and qualifications"
          name="sailingQualifications"
          rows={2}
          value={form.sailingQualifications}
          onChange={handleChange}
          placeholder="e.g. Coastal license, offshore license, restricted radio certificate…"
        />

        <Textarea
          label="Sailing areas"
          name="sailingAreas"
          rows={2}
          value={form.sailingAreas}
          onChange={handleChange}
          placeholder="e.g. Mediterranean, Atlantic, English Channel…"
        />

        <Textarea
          label="Sailor introduction"
          name="sailorBio"
          rows={4}
          value={form.sailorBio}
          onChange={handleChange}
          placeholder="Describe your sailing background, notable trips, and approach…"
        />

        <div className="flex justify-end pt-1">
          <Button type="submit" loading={mutation.isPending}>
            Save
          </Button>
        </div>
      </form>

      <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
          Supporting document for verification
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Upload a license, diploma, certificate, or nautical attestation. A SailingLoc admin can verify your CV.
        </p>
        {user?.sailorCvRejectionReason && status === 'REJECTED' && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-3">
            Rejection reason: {user.sailorCvRejectionReason}
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
          Upload supporting document
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
      toast.success('Password changed successfully')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setFieldError('')
    },
    onError: (err: unknown) => {
      // Affiche le message serveur sous le champ (ex: mot de passe actuel incorrect)
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined
      setFieldError(msg ?? 'Error changing password')
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
        `New password must be at least ${MIN_PASSWORD_LEN} characters`,
      )
      return
    }
    if (form.newPassword.length > MAX_PASSWORD_LEN) {
      setFieldError(`Password must not exceed ${MAX_PASSWORD_LEN} characters`)
      return
    }
    if (
      !/[A-Z]/.test(form.newPassword) ||
      !/[a-z]/.test(form.newPassword) ||
      !/[0-9]/.test(form.newPassword) ||
      !/[^A-Za-z0-9]/.test(form.newPassword)
    ) {
      setFieldError(
        'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
      )
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setFieldError('Passwords do not match')
      return
    }

    mutation.mutate({
      currentPassword: form.currentPassword,
      newPassword:     form.newPassword,
    })
  }

  return (
    <div className={CARD}>
      <div className="flex items-center gap-2.5 mb-6">
        <SectionIcon icon={<Lock size={16} />} />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Security</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Current password"
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
          label="New password"
          name="newPassword"
          type={visible.new ? 'text' : 'password'}
          value={form.newPassword}
          onChange={handleChange}
          helperText={`${MIN_PASSWORD_LEN}+ chars · uppercase · number`}
          required
          rightIcon={visible.new ? <EyeOff size={16} /> : <Eye size={16} />}
          onRightIconClick={() => toggle('new')}
        />
        <Input
          label="Confirm new password"
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
            Change password
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Paiement ───────────────────────────────────────────────────────────────

interface AddCardModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSetupClientSecret(null)
      setError(null)
      return
    }

    let isCancelled = false

    const init = async () => {
      try {
        const { clientSecret } = await stripeApi.createSetupIntent()
        if (!isCancelled) {
          setSetupClientSecret(clientSecret)
          setError(null)
        }
      } catch {
        if (!isCancelled) {
          setSetupClientSecret(null)
          setError('Unable to start card setup right now.')
        }
      }
    }

    void init()
    return () => {
      isCancelled = true
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a card" size="md">
      <div className="p-6">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : setupClientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret: setupClientSecret }}>
            <AddCardForm onSuccess={onSuccess} onCancel={onClose} />
          </Elements>
        ) : (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        )}
      </div>
    </Modal>
  )
}

interface AddCardFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const AddCardForm: React.FC<AddCardFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })

    setLoading(false)

    if (stripeError) {
      setError(stripeError.message ?? 'Something went wrong.')
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={loading} disabled={!stripe}>
          Save card
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

const PaymentSection: React.FC = () => {
  const { user } = useAuthStore()
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)

  const handleCardSaved = () => {
    setIsAddCardOpen(false)
    toast.success('Card added successfully')
  }

  return (
    <>
      <div className={CARD}>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Payment</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your payment method and enjoy a secure checkout for your bookings.</p>
          </div>
          <div className="rounded-2xl bg-ocean-50 p-2 text-ocean-700">
            <CreditCard size={18} />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-[#071d49] via-[#0A737A] to-[#0f8e9d] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Payment account</p>
              <p className="mt-1 text-lg font-semibold">{user?.email}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm text-white/70">Status</p>
            <p className="mt-1 text-base font-semibold">Secure payments via Stripe</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Add a card</p>
            <p className="mt-1 text-sm text-gray-600">Save a card to speed up bookings and pay securely.</p>
            <Button onClick={() => setIsAddCardOpen(true)} size="sm" className="mt-4">
              Add a card
            </Button>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm font-semibold text-gray-900">Stripe payments</p>
            <p className="mt-1 text-sm text-gray-600">Your bookings use Stripe as the primary payment method, with a secure experience.</p>
            <div className="mt-3 inline-flex rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-700">
              Secure
            </div>
          </div>
        </div>
      </div>

      <AddCardModal isOpen={isAddCardOpen} onClose={() => setIsAddCardOpen(false)} onSuccess={handleCardSaved} />
    </>
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
      toast.success('Compte supprimé. Un email de confirmation vous a été envoyé.')
      logout()
      navigate('/', { replace: true })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de la suppression du compte'
      toast.error(msg)
    },
  })

  const handleDelete = () => {
    if (confirmEmail.trim().toLowerCase() !== user?.email?.trim().toLowerCase()) {
      toast.error("L'adresse email saisie ne correspond pas")
      return
    }
    deleteMutation.mutate()
  }

  return (
    <div className={CARD}>
      <div className="flex items-center gap-2.5 mb-1">
        <SectionIcon icon={<ShieldAlert size={17} />} />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Données &amp; confidentialité</h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 ml-[46px]">
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de portabilité et d&apos;effacement de vos données.
      </p>

      {/* Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Exporter mes données</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Téléchargez une copie de vos données personnelles au format JSON.
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

      {/* Account deletion */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5">
        <div>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Supprimer mon compte</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Action irréversible. Vos données personnelles seront anonymisées (RGPD art. 17).
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

      {/* Confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Supprimer mon compte
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cette action est <strong>irréversible</strong>. Vos données personnelles seront anonymisées.
              Pour confirmer, saisissez votre adresse email : <strong>{user?.email}</strong>
            </p>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Votre adresse email"
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
                disabled={
                  deleteMutation.isPending ||
                  confirmEmail.trim().toLowerCase() !== user?.email?.trim().toLowerCase()
                }
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
    { id: 'marin', label: 'CV marin', icon: <Anchor size={18} />, ownerOnly: true },
    { id: 'securite', label: 'Sécurité', icon: <Shield size={18} /> },
    { id: 'donnees', label: 'Paiement', icon: <CreditCard size={18} /> },
    { id: 'confidentialite', label: 'Confidentialité', icon: <ShieldAlert size={18} /> },
  ]

  const visibleTabs = tabs.filter((t) => !t.ownerOnly || isOwner)

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-ocean-100 flex items-center justify-center ring-1 ring-ocean-200">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-ocean-700">{getInitials(user.firstName, user.lastName)}</span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">My profile</h1>
              <p className="text-sm text-gray-500">{user.firstName} {user.lastName} · {user.email}</p>
            </div>
          </div>
          {publicProfilePath && (
            <Link
              to={MY_PUBLIC_PROFILE_ROUTE}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-ocean-700 hover:text-ocean-800"
            >
              <ExternalLink size={15} />
              View my public profile
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
          {activeTab === 'donnees' && <PaymentSection />}
          {activeTab === 'confidentialite' && <DataPrivacySection />}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
