import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Clock, Send, HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { usePageTitle } from '../hooks/usePageTitle'

// ─── Données de contact fictives ──────────────────────────────────────────────

// #1 — Référence de composant au lieu de JSX pré-rendu dans les données
interface ContactInfo {
  icon: LucideIcon
  title: string
  value: string
  detail: string
}

const CONTACT_INFO: ContactInfo[] = [
  {
    icon: Mail,
    title: 'E-mail',
    value: 'contact@sailingloc.fr',
    detail: 'Réponse sous 24 h ouvrées',
  },
  {
    icon: Phone,
    title: 'Téléphone',
    value: '+33 1 23 45 67 89',
    detail: 'Lun–Ven, 9 h – 18 h',
  },
  {
    icon: MapPin,
    title: 'Adresse',
    value: '12 Quai de la Joliette, 13002 Marseille',
    detail: 'Siège social (pas de permanence)',
  },
  {
    icon: Clock,
    title: 'Disponibilité',
    value: 'Lun–Ven, 9 h – 18 h',
    detail: 'Hors jours fériés',
  },
]

const SUBJECTS = [
  'Question sur une réservation',
  'Problème technique',
  "Signalement d'annonce",
  'Partenariat / Presse',
  'Autre',
]

const EMPTY_FORM = { name: '', email: '', subject: SUBJECTS[0], message: '' }

// ─── Page Contact ─────────────────────────────────────────────────────────────

const Contact: React.FC = () => {
  // #6 — Titre de l'onglet pour le SEO et l'accessibilité
  usePageTitle('Contactez-nous')

  // État du formulaire — mock visuel, pas de backend
  const [form, setForm] = useState(EMPTY_FORM)
  const [sent, setSent] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulation d'envoi — pas de vrai backend dans ce prototype
    setSent(true)
  }

  // #4 — Réinitialise le formulaire pour permettre un second envoi
  const handleReset = () => {
    setSent(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* #2 — Hero extrait en composant partagé PageHero */}
      <PageHero
        icon={Mail}
        badge="Nous contacter"
        title="Contactez-nous"
        subtitle="Une question, un problème ou une idée ? Notre équipe vous répond rapidement."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Infos de contact */}
          <div className="lg:col-span-1 space-y-4">
            {CONTACT_INFO.map((info) => (
              <div
                key={info.title}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-start gap-4"
              >
                <div className="shrink-0 bg-ocean-50 dark:bg-ocean-900/30 rounded-xl p-2.5">
                  {/* #1 — Instanciation à la volée depuis la référence de composant */}
                  <info.icon size={22} className="text-ocean-600 dark:text-ocean-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                    {info.title}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{info.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{info.detail}</p>
                </div>
              </div>
            ))}

            {/* Lien FAQ */}
            <div className="bg-ocean-50 dark:bg-ocean-900/30 rounded-2xl border border-ocean-100 dark:border-ocean-800 p-5 text-center">
              <HelpCircle size={28} className="text-ocean-600 dark:text-ocean-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Consultez d'abord la FAQ</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                La réponse à votre question s'y trouve peut-être déjà.
              </p>
              <Link
                to="/faq"
                className="inline-block text-xs font-semibold text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-400 transition-colors underline underline-offset-2"
              >
                Voir la FAQ →
              </Link>
            </div>
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
            {sent ? (
              <div className="text-center py-10">
                <Send size={40} className="text-ocean-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Message envoyé !</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Merci de nous avoir contactés. Nous vous répondrons dans les 24 h ouvrées.
                </p>
                {/* #4 — Bouton de réinitialisation pour envoyer un autre message */}
                <button
                  onClick={handleReset}
                  className="mt-5 text-sm text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 underline underline-offset-2 transition-colors"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Nom */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Nom complet
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white dark:bg-gray-900"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Adresse e-mail
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jean@exemple.fr"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>

                {/* Sujet */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Sujet
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white dark:bg-gray-900"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Message
                  </label>
                  {/* #4 — minLength pour éviter les soumissions triviales */}
                  <textarea
                    id="message"
                    name="message"
                    required
                    minLength={10}
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Décrivez votre demande en détail…"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none bg-white dark:bg-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-ocean-700 hover:bg-ocean-800 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
                >
                  <Send size={15} />
                  Envoyer le message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
