import React from 'react'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

const Cgu: React.FC = () => {
  usePageTitle("Conditions Générales d'Utilisation")

  return (
    <LegalPageLayout
      title="Conditions Générales d'Utilisation"
      lastUpdated="Dernière mise à jour : 1er janvier 2026"
    >
      <LegalSection title="Article 1 - Objet">
        <p>
          Les présentes CGU régissent l'accès et l'utilisation de la plateforme SailingLoc,
          accessible à l'adresse sailingloc.fr, éditée par SailingLoc SAS. En accédant à la
          plateforme, l'utilisateur accepte sans réserve les présentes CGU.
        </p>
      </LegalSection>

      <LegalSection title="Article 2 - Accès à la plateforme">
        <p>
          L'accès est libre et gratuit pour toute personne physique majeure. L'inscription est
          nécessaire pour effectuer ou proposer une location. La Société se réserve le droit de
          suspendre tout utilisateur en cas de violation des CGU.
        </p>
      </LegalSection>

      <LegalSection title="Article 3 - Inscription et compte utilisateur">
        <p>
          L'utilisateur s'engage à fournir des informations exactes et à jour. Toute usurpation
          d'identité est interdite. L'utilisateur est seul responsable de la confidentialité de
          ses identifiants.
        </p>
      </LegalSection>

      <LegalSection title="Article 4 - Obligations des utilisateurs">
        <p>
          L'utilisateur s'engage à utiliser la plateforme conformément aux lois en vigueur. Il est
          interdit de contourner les systèmes de paiement de SailingLoc.
        </p>
      </LegalSection>

      <LegalSection title="Article 5 - Réservations">
        <p>
          Toute réservation constitue un contrat entre locataire et propriétaire. SailingLoc agit en
          tant qu'intermédiaire. Le propriétaire dispose de 24h pour accepter ou refuser. En cas de
          silence, la réservation est annulée automatiquement.
        </p>
      </LegalSection>

      <LegalSection title="Article 6 - Paiements et commissions">
        <p>
          Les paiements sont traités par Stripe. SailingLoc perçoit une commission sur chaque
          transaction confirmée. Les remboursements sont soumis à la politique d'annulation du
          propriétaire.
        </p>
      </LegalSection>

      <LegalSection title="Article 7 - Résiliation">
        <p>
          L'utilisateur peut supprimer son compte depuis ses paramètres. Les obligations
          financières nées avant la résiliation restent dues.
        </p>
      </LegalSection>

      <LegalSection title="Article 8 - Droit applicable">
        <p>
          Les CGU sont soumises au droit français. En cas de litige, les tribunaux compétents de
          Marseille seront saisis.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default Cgu
