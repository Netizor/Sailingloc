import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, Clock, Send, HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { usePageTitle } from '../hooks/usePageTitle'

interface ContactInfo {
  icon: LucideIcon
  titleKey: string
  valueKey: string
  detailKey: string
}

const CONTACT_INFO: ContactInfo[] = [
  { icon: Mail, titleKey: 'email', valueKey: 'emailValue', detailKey: 'emailDetail' },
  { icon: Phone, titleKey: 'phone', valueKey: 'phoneValue', detailKey: 'phoneDetail' },
  { icon: MapPin, titleKey: 'address', valueKey: 'addressValue', detailKey: 'addressDetail' },
  { icon: Clock, titleKey: 'availability', valueKey: 'availabilityValue', detailKey: 'availabilityDetail' },
]

const SUBJECT_KEYS = ['booking', 'technical', 'report', 'partnership', 'other'] as const

const Contact: React.FC = () => {
  const { t } = useTranslation()
  usePageTitle(t('contactPage.pageTitle'))

  const defaultSubject = t(`contactPage.subjects.${SUBJECT_KEYS[0]}`)
  const EMPTY_FORM = { name: '', email: '', subject: defaultSubject, message: '' }

  const [form, setForm] = useState(EMPTY_FORM)
  const [sent, setSent] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const handleReset = () => {
    setSent(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <PageHero
        icon={Mail}
        badge={t('contactPage.badge')}
        title={t('contactPage.title')}
        subtitle={t('contactPage.subtitle')}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            {CONTACT_INFO.map((info) => (
              <div
                key={info.titleKey}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-start gap-4"
              >
                <div className="shrink-0 bg-ocean-50 dark:bg-ocean-900/30 rounded-xl p-2.5">
                  <info.icon size={22} className="text-ocean-600 dark:text-ocean-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                    {t(`contactPage.${info.titleKey}`)}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t(`contactPage.${info.valueKey}`)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t(`contactPage.${info.detailKey}`)}
                  </p>
                </div>
              </div>
            ))}

            <div className="bg-ocean-50 dark:bg-ocean-900/30 rounded-2xl border border-ocean-100 dark:border-ocean-800 p-5 text-center">
              <HelpCircle size={28} className="text-ocean-600 dark:text-ocean-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                {t('contactPage.faqTitle')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t('contactPage.faqHint')}
              </p>
              <Link
                to="/faq"
                className="inline-block text-xs font-semibold text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-400 transition-colors underline underline-offset-2"
              >
                {t('contactPage.faqLink')}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
            {sent ? (
              <div className="text-center py-10">
                <Send size={40} className="text-ocean-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('contactPage.sentTitle')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('contactPage.sentHint')}
                </p>
                <button
                  onClick={handleReset}
                  className="mt-5 text-sm text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 underline underline-offset-2 transition-colors"
                >
                  {t('contactPage.sendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('contactPage.nameLabel')}
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder={t('contactPage.namePlaceholder')}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('contactPage.emailLabel')}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder={t('contactPage.emailPlaceholder')}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('contactPage.subjectLabel')}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white dark:bg-gray-900"
                  >
                    {SUBJECT_KEYS.map((key) => (
                      <option key={key} value={t(`contactPage.subjects.${key}`)}>
                        {t(`contactPage.subjects.${key}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('contactPage.messageLabel')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    minLength={10}
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t('contactPage.messagePlaceholder')}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none bg-white dark:bg-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-ocean-700 hover:bg-ocean-800 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
                >
                  <Send size={15} />
                  {t('contactPage.submit')}
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
