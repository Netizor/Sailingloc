import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react'
import type { ProfileIssue } from '../../hooks/useProfileCompletion'
import Button from './Button'

interface BlockedModalProps {
  issues: ProfileIssue[]
}

/**
 * Overlay bloquant affiché sur une page entière inaccessible.
 * La page derrière est visible mais floutée et non interactive.
 * Non fermable : l'utilisateur doit résoudre les problèmes ou revenir en arrière.
 */
const BlockedModal: React.FC<BlockedModalProps> = ({ issues }) => {
  const navigate = useNavigate()

  return (
    /* Fond flouté - backdrop-blur agit sur le contenu de la page derrière */
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>

      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">

        {/* En-tête */}
        <div className="bg-gradient-to-r from-ocean-700 to-ocean-600 px-8 py-7">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2.5">
              <ShieldAlert size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Action non disponible
              </h2>
              <p className="text-ocean-200 text-sm mt-0.5">
                Complétez votre profil pour accéder à cette fonctionnalité
              </p>
            </div>
          </div>
        </div>

        {/* Liste des étapes manquantes */}
        <div className="px-8 py-6 space-y-4">
          {issues.map((issue, idx) => (
            <div
              key={issue.key}
              className="flex gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            >
              {/* Numéro de l'étape */}
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-ocean-100 dark:bg-ocean-900/40 flex items-center justify-center text-ocean-700 dark:text-ocean-400 font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {issue.title}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 leading-relaxed">
                  {issue.description}
                </p>
                <button
                  onClick={
                    issue.actionType === 'navigate'
                      ? () => navigate(issue.actionTo!)
                      : issue.actionFn
                  }
                  className="mt-2.5 text-xs font-semibold text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-200 underline underline-offset-2 transition-colors"
                >
                  {issue.actionLabel} →
                </button>
              </div>
              {/* Indicateur : pas encore fait */}
              <div className="flex-shrink-0">
                <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
              </div>
            </div>
          ))}
        </div>

        {/* Pied de page */}
        <div className="px-8 pb-8 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5">
            <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
            <span>Ces étapes ne sont demandées qu'une seule fois.</span>
          </div>
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft size={14} />}
            onClick={() => navigate(-1)}
          >
            Retour
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BlockedModal
