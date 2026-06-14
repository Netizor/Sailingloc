import React from 'react'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

// ─── Tableau des types de cookies ─────────────────────────────────────────────

const COOKIE_TYPES = [
  {
    type: 'Cookies essentiels',
    purpose: 'Authentification, sécurité, session utilisateur',
    duration: 'Session / 7 jours',
    consent: 'Non requis',
  },
  {
    type: 'Cookies analytiques',
    purpose: "Mesure d'audience, amélioration des pages (anonymisés)",
    duration: '13 mois',
    consent: 'Requis',
  },
  {
    type: 'Cookies marketing',
    purpose: 'Personnalisation des publicités, retargeting',
    duration: '30 jours',
    consent: 'Requis',
  },
]

// ─── Page Politique de cookies ────────────────────────────────────────────────

const Cookies: React.FC = () => {
  // #6 - Titre de l'onglet pour le SEO et l'accessibilité
  usePageTitle('Politique de cookies')

  return (
    // #7 - badge <span> (cohérence via PageHero)  #8 - boilerplate hero + carte extrait dans LegalPageLayout
    <LegalPageLayout
      title="Politique de cookies"
      lastUpdated="Dernière mise à jour : 1er janvier 2026"
    >
      <LegalSection title="1. Qu'est-ce qu'un cookie ?">
        <p>
          Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone,
          tablette) lorsque vous visitez un site internet. Il permet au site de mémoriser vos
          préférences et d'améliorer votre expérience de navigation.
        </p>
        <p>
          Les cookies ne contiennent pas de virus et ne peuvent pas lire d'autres fichiers sur votre
          terminal. Ils sont strictement limités aux finalités décrites ci-dessous.
        </p>
      </LegalSection>

      <LegalSection title="2. Types de cookies utilisés">
        <p>SailingLoc utilise trois catégories de cookies :</p>
        {/* Tableau responsive */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">
                  Type
                </th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">
                  Finalité
                </th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">
                  Durée
                </th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">
                  Consentement
                </th>
              </tr>
            </thead>
            <tbody>
              {COOKIE_TYPES.map((row) => (
                <tr key={row.type} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 border border-gray-200 font-medium text-gray-800">
                    {row.type}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-600">{row.purpose}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-600">{row.duration}</td>
                  <td className="px-3 py-2 border border-gray-200">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.consent === 'Requis'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      {row.consent}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="3. Durée de vie des cookies">
        <p>
          Les cookies de session expirent automatiquement à la fermeture de votre navigateur.
          Les cookies persistants ont une durée de vie définie dans le tableau ci-dessus, à compter
          de leur dépôt. À l'issue de cette durée, ils sont automatiquement supprimés.
        </p>
      </LegalSection>

      <LegalSection title="4. Comment paramétrer vos cookies">
        <p>
          Vous pouvez accepter ou refuser les cookies non essentiels à tout moment depuis le bandeau
          de consentement affiché lors de votre première visite, ou via les paramètres de votre
          navigateur :
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies
          </li>
          <li>
            <strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies
          </li>
          <li>
            <strong>Safari :</strong> Préférences → Confidentialité
          </li>
          <li>
            <strong>Edge :</strong> Paramètres → Cookies et autorisations de site
          </li>
        </ul>
        <p>
          Notez que le refus de cookies essentiels peut altérer le fonctionnement de la plateforme
          (connexion impossible, perte de préférences).
        </p>
      </LegalSection>

      <LegalSection title="5. Contact">
        <p>
          Pour toute question relative à notre utilisation des cookies, contactez notre DPO à
          l'adresse{' '}
          <a
            href="mailto:dpo@sailingloc.fr"
            className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2"
          >
            dpo@sailingloc.fr
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default Cookies
