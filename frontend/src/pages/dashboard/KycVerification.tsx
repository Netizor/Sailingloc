import React, { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Upload,
  FileImage,
  X,
  CheckCircle,
} from 'lucide-react'
import { getKycStatus, submitKyc } from '../../api/kyc.api'
import type { KycStatus } from '../../api/kyc.api'
import { formatDate } from '../../lib/utils'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

// ─── Bloc de statut ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<KycStatus, {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  bg: string
}> = {
  NOT_SUBMITTED: {
    icon: <ShieldAlert size={24} />,
    title: 'Identité non vérifiée',
    description: "Soumettez votre pièce d'identité pour accéder à toutes les fonctionnalités de la plateforme.",
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600',
  },
  PENDING: {
    icon: <Clock size={24} />,
    title: 'Vérification en cours',
    description: "Vos documents ont été reçus et sont en cours d'examen par notre équipe (sous 24-48h).",
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
  APPROVED: {
    icon: <ShieldCheck size={24} />,
    title: 'Identité vérifiée',
    description: "Votre identité a été validée. Vous bénéficiez de l'accès complet à la plateforme.",
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
  },
  REJECTED: {
    icon: <ShieldAlert size={24} />,
    title: 'Vérification refusée',
    description: 'Votre dossier a été rejeté. Veuillez soumettre à nouveau vos documents.',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
}

// ─── Zone de dépôt de fichier ──────────────────────────────────────────────────

interface FileDropProps {
  label: string
  file: File | null
  onSelect: (f: File) => void
  onRemove: () => void
}

const FileDrop: React.FC<FileDropProps> = ({ label, file, onSelect, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onSelect(f)
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {file ? (
        <div className="flex items-center gap-3 p-3 bg-ocean-50 dark:bg-ocean-900/30 border border-ocean-200 dark:border-ocean-700 rounded-xl">
          <FileImage size={20} className="text-ocean-600 dark:text-ocean-400 flex-shrink-0" />
          <span className="text-sm text-ocean-800 dark:text-ocean-300 font-medium flex-1 truncate">{file.name}</span>
          <button
            onClick={onRemove}
            className="p-1 hover:bg-ocean-100 dark:hover:bg-ocean-800/40 rounded-lg text-ocean-500 transition-colors"
            aria-label="Supprimer le fichier"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 p-4 sm:p-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl hover:border-ocean-400 hover:bg-ocean-50/50 dark:hover:bg-ocean-900/20 transition-colors text-gray-400 dark:text-gray-500 hover:text-ocean-600"
        >
          <Upload size={22} />
          <span className="text-sm">Cliquer pour sélectionner (JPG, PNG, PDF)</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

const KycVerification: React.FC = () => {
  const qc = useQueryClient()
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)

  const { data: kycData, isLoading } = useQuery({
    queryKey: ['kyc', 'status'],
    queryFn: getKycStatus,
  })

  const submitMutation = useMutation({
    mutationFn: () => submitKyc(frontFile!, backFile!),
    onSuccess: () => {
      toast.success('Documents envoyés avec succès')
      setFrontFile(null)
      setBackFile(null)
      qc.invalidateQueries({ queryKey: ['kyc'] })
    },
    onError: () => toast.error("Erreur lors de l'envoi des documents"),
  })

  const status = kycData?.status ?? 'NOT_SUBMITTED'
  const config = STATUS_CONFIG[status]
  const canSubmit = status === 'NOT_SUBMITTED' || status === 'REJECTED'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Vérification d'identité</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        La vérification d'identité est requise pour effectuer des réservations et recevoir des paiements.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bloc statut */}
          <div className={`flex items-start gap-4 p-5 rounded-2xl border ${config.bg}`}>
            <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>{config.icon}</div>
            <div className="flex-1">
              <p className={`font-semibold text-base ${config.color}`}>{config.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{config.description}</p>
              {kycData?.rejectionReason && status === 'REJECTED' && (
                <p className="text-sm text-red-500 mt-2 font-medium">
                  Motif : {kycData.rejectionReason}
                </p>
              )}
              {kycData?.submittedAt && status === 'PENDING' && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Soumis le {formatDate(kycData.submittedAt)}
                </p>
              )}
              {kycData?.reviewedAt && status === 'APPROVED' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Vérifié le {formatDate(kycData.reviewedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Formulaire d'upload */}
          {canSubmit && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Soumettre votre pièce d'identité
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Formats acceptés : JPEG, PNG, PDF - max. 10 Mo par fichier.
                Pièces acceptées : carte nationale d'identité, passeport, permis de conduire.
              </p>

              <FileDrop
                label="Recto (face avant)"
                file={frontFile}
                onSelect={setFrontFile}
                onRemove={() => setFrontFile(null)}
              />
              <FileDrop
                label="Verso (face arrière)"
                file={backFile}
                onSelect={setBackFile}
                onRemove={() => setBackFile(null)}
              />

              <Button
                variant="primary"
                fullWidth
                onClick={() => submitMutation.mutate()}
                disabled={!frontFile || !backFile}
                loading={submitMutation.isPending}
                leftIcon={<Upload size={15} />}
              >
                Envoyer les documents
              </Button>
            </div>
          )}

          {/* Informations */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p className="font-medium text-gray-700 dark:text-gray-300">Pourquoi cette vérification ?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sécuriser les transactions entre locataires et propriétaires</li>
              <li>Respecter nos obligations légales (KYC réglementaire)</li>
              <li>Protéger tous les membres de la communauté SailingLoc</li>
            </ul>
            <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
              Vos données sont chiffrées et ne sont jamais partagées avec des tiers.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default KycVerification
