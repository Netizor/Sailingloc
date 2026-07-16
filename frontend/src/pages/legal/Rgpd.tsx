import React from 'react'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

const Rgpd: React.FC = () => {
  usePageTitle('Politique de Protection des Données (RGPD)')

  return (
    <LegalPageLayout
      title="Politique de Protection des Données (RGPD)"
      lastUpdated="Dernière mise à jour : 1er janvier 2026"
    >
      <LegalSection title="1. Responsable du traitement">
        <p>
          SailingLoc SAS, 12 Quai de la Joliette, 13002 Marseille - contact@sailingloc.fr. DPO :
          dpo@sailingloc.fr
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <p>
          Identité (nom, prénom, date de naissance, pièce d'identité), Contact (email, téléphone),
          Compte (identifiant, rôle), Financières (IBAN propriétaires, carte via Stripe),
          Navigation (IP, cookies techniques), Contenu généré (annonces, avis, messages, photos).
        </p>
      </LegalSection>

      <LegalSection title="3. Finalités">
        <p>
          Gestion des comptes et authentification, mise en relation et réservations, traitement des
          paiements via Stripe, notifications transactionnelles, prévention de la fraude,
          amélioration du service, obligations légales.
        </p>
      </LegalSection>

      <LegalSection title="4. Durée de conservation">
        <p>
          Compte actif pendant toute la relation contractuelle, compte supprimé 3 ans après
          suppression, données de paiement 5 ans (Code de commerce), logs de navigation 12 mois
          maximum.
        </p>
      </LegalSection>

      <LegalSection title="5. Vos droits">
        <p>
          Droit d'accès, rectification, effacement (droit à l'oubli), portabilité, opposition,
          limitation. Réclamation possible auprès de la CNIL sur{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 underline underline-offset-2"
          >
            www.cnil.fr
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Transferts hors UE">
        <p>
          Vercel Inc. (USA) hébergement frontend, Railway Corp. (USA) hébergement backend,
          Cloudinary Ltd. (USA) stockage photos, Stripe Inc. (USA) paiements certifié PCI-DSS,
          Resend Inc. (USA) emails transactionnels. Tous encadrés par les Clauses Contractuelles
          Types (CCT).
        </p>
      </LegalSection>

      <LegalSection title="7. Contact DPO">
        <p>
          dpo@sailingloc.fr : réponse sous un mois.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default Rgpd
