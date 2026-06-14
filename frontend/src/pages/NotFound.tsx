import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Anchor, ArrowLeft, Home } from 'lucide-react'
import Button from '../components/ui/Button'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50 dark:from-gray-900 to-white dark:to-gray-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Illustration */}
        <div className="relative inline-flex mb-8">
          <div className="h-32 w-32 rounded-full bg-ocean-50 dark:bg-ocean-900/30 border-4 border-ocean-100 dark:border-ocean-800 flex items-center justify-center">
            <Anchor size={56} className="text-ocean-300" strokeWidth={1.5} />
          </div>
          {/* Waves */}
          <div className="absolute -bottom-3 left-0 right-0 flex justify-center">
            <WaveIllustration />
          </div>
        </div>

        {/* 404 */}
        <p className="text-8xl font-black text-ocean-100 dark:text-ocean-900 leading-none mb-1 select-none">
          404
        </p>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Page introuvable</h1>
        <p className="text-gray-500 dark:text-gray-400 text-base mb-8 leading-relaxed">
          Vous naviguez en dehors des eaux cartographiées. Cette page n&apos;existe pas ou a été
          déplacée.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft size={16} />}
          >
            Retour
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/')}
            leftIcon={<Home size={16} />}
          >
            Retour à l&apos;accueil
          </Button>
        </div>

        <p className="mt-10 text-xs text-gray-300 dark:text-gray-600">SailingLoc - Projet étudiant DSP4 O24</p>
      </div>
    </div>
  )
}

const WaveIllustration: React.FC = () => (
  <svg
    width="160"
    height="24"
    viewBox="0 0 160 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M0 12 Q20 0 40 12 Q60 24 80 12 Q100 0 120 12 Q140 24 160 12"
      stroke="#bae6fd"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M0 18 Q20 6 40 18 Q60 30 80 18 Q100 6 120 18 Q140 30 160 18"
      stroke="#e0f2fe"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
)

export default NotFound
