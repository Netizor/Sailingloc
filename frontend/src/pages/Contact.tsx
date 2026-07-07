import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone,
  MapPin,
  ShieldCheck,
  Plus,
  ArrowRight,
  Send,
} from 'lucide-react'
// import type { LucideIcon } from 'lucide-react'
// import PageHero from '../components/ui/PageHero'
import { usePageTitle } from '../hooks/usePageTitle'

const SUBJECTS = [
  'Réservation Premium',
  'Question technique',
  'Devenir propriétaire',
  'Conciergerie',
  'Autre demande',
]

const Contact: React.FC = () => {
  usePageTitle('Contact - SailingLoc')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: SUBJECTS[0],
    message: '',
  })

  const [sent, setSent] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#071d49]">
      <section
        className="relative min-h-[430px] bg-cover bg-center px-8 pt-24 pb-20 lg:px-14"
        style={{
          backgroundImage:
            "linear-gradient(rgba(3,18,50,.68), rgba(3,18,50,.76)), url('/contact-hero.jpg')",
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl font-bold leading-tight lg:text-6xl">
              Discutons de votre
              <br />
              prochaine escale.
            </h1>

            <p className="mt-6 max-w-xl leading-relaxed text-white/85">
              Une demande spécifique, une envie d’évasion sur-mesure ou une question technique ?
              Notre équipe de concierges maritimes est à votre entière disposition.
            </p>
          </div>
        </div>
      </section>

      <section className="relative -mt-24 px-8 pb-24 lg:px-14">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="rounded-xl bg-white p-10 shadow-2xl lg:col-span-3">
            <h2 className="mb-8 text-3xl font-bold">Envoyez-nous un message</h2>

            {sent ? (
              <div className="py-16 text-center">
                <Send size={42} className="mx-auto mb-4 text-[#0A737A]" />
                <h3 className="text-2xl font-bold">Message envoyé !</h3>
                <p className="mt-3 text-gray-500">
                  Merci pour votre demande. Notre équipe vous répondra rapidement.
                </p>

                <button
                  onClick={() => setSent(false)}
                  className="mt-6 font-bold text-[#0A737A] underline"
                  type="button"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest">
                      Prénom
                    </label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Jean"
                      required
                      className="w-full rounded-lg bg-gray-100 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest">
                      Nom
                    </label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Dupont"
                      required
                      className="w-full rounded-lg bg-gray-100 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-[#0A737A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jean.dupont@email.com"
                    required
                    className="w-full rounded-lg bg-gray-100 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest">
                    Objet de votre demande
                  </label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-gray-100 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    {SUBJECTS.map((subject) => (
                      <option key={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Décrivez votre projet d’évasion..."
                    required
                    rows={6}
                    className="w-full resize-none rounded-lg bg-gray-100 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#0A737A] py-4 font-semibold text-white shadow-lg transition duration-300 hover:bg-[#096A71]"
                >
                  Envoyer la demande
                </button>
              </form>
            )}
          </div>

          <div className="space-y-8 lg:col-span-2">
            <InfoCard
              icon={Phone}
              title="Ligne Directe"
              text="Disponible du lundi au samedi, 9h - 19h."
              action="+33 (0)1 84 20 40 10"
            />

            <InfoCard
              icon={MapPin}
              title="Bureau Principal"
              text="Port de la Plaisance, 06400 Cannes, France"
              action="ITINÉRAIRE"
            />

            <InfoCard
              icon={ShieldCheck}
              title="Support 24/7"
              text="Pour nos membres en mer uniquement."
              action="VIP Exclusive Line"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f1f2f4] px-8 py-24 lg:px-14">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="mb-8 text-3xl font-bold">Questions Fréquentes</h2>

            <div className="max-w-lg space-y-4">
              {[
                'Comment réserver sans permis bateau ?',
                "Quelles sont les conditions d’annulation ?",
                'Assurez-vous la livraison au port ?',
              ].map((question) => (
                <div
                  key={question}
                  className="flex items-center justify-between rounded-lg bg-white px-6 py-5 shadow-sm"
                >
                  <span className="text-sm font-semibold">{question}</span>
                  <Plus size={18} className="text-[#0A737A]" />
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
  <img
    src="/contact-map.jpg"
    alt="Port de Cannes"
    className="h-full w-full object-cover"
  />
</div>
        </div>
      </section>

      <section className="bg-[#f8f9fb] px-8 py-20 lg:px-14">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
          <PromoCard
            image="/contact-boats.jpg"
            title="Nos bateaux"
            text="Découvrez l’exception."
            to="/bateaux"
          />

          <PromoCard
            image="/contact-destinations.jpg"
            title="Destinations"
            text="Les joyaux de la Méditerranée."
            to="/destinations"
          />

          <PromoCard
            image="/contact-services.jpg"
            title="Nos services"
            text="Un service sans limite."
            to="/a-propos"
          />
        </div>
      </section>
    </div>
  )
}

interface InfoCardProps {
  icon: React.ElementType
  title: string
  text: string
  action: string
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, text, action }) => (
  <div className="flex items-start gap-6 rounded-xl bg-white p-8 shadow-xl">
    <div className="rounded-full bg-[#0A737A] p-4 text-white">
      <Icon size={22} />
    </div>

    <div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{text}</p>
      <p className="mt-5 font-bold text-[#0A737A]">{action}</p>
    </div>
  </div>
)

interface PromoCardProps {
  image: string
  title: string
  text: string
  to: string
}

const PromoCard: React.FC<PromoCardProps> = ({ image, title, text, to }) => (
  <Link
    to={to}
    className="group relative h-[230px] overflow-hidden rounded-xl bg-cover bg-center shadow-lg"
    style={{
      backgroundImage: `linear-gradient(rgba(3,18,50,.15), rgba(3,18,50,.75)), url(${image})`,
    }}
  >
    <div className="absolute bottom-6 left-6 right-6 text-white">
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-1 text-white/80">{text}</p>
    </div>

    <ArrowRight
      size={24}
      className="absolute bottom-7 right-6 text-white transition-transform group-hover:translate-x-1"
    />
  </Link>
)

export default Contact