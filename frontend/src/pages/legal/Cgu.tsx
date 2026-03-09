import React from 'react'
import { FileText } from 'lucide-react'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

// ─── Page CGU ─────────────────────────────────────────────────────────────────

const Cgu: React.FC = () => {
  // #6 — Titre de l'onglet pour le SEO et l'accessibilité
  usePageTitle("Conditions Générales d'Utilisation")

  return (
    // #7 — badge <span> (cohérence via PageHero)  #8 — boilerplate hero + carte extrait dans LegalPageLayout
    <LegalPageLayout
      icon={FileText}
      badge="Légal"
      title="Conditions Générales d'Utilisation"
      lastUpdated="Dernière mise à jour : 1er janvier 2026"
    >
      <LegalSection title="Article 1 — Objet">
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
          de la plateforme SailingLoc, accessible à l'adresse sailingloc.fr, éditée par SailingLoc
          SAS (ci-après « la Société »).
        </p>
        <p>
          En accédant à la plateforme, l'utilisateur accepte sans réserve les présentes CGU. Toute
          utilisation implique l'adhésion pleine et entière aux conditions ci-dessous.
        </p>
      </LegalSection>

      <LegalSection title="Article 2 — Accès à la plateforme">
        <p>
          L'accès à la plateforme est libre et gratuit pour toute personne physique majeure capable
          juridiquement. L'inscription est nécessaire pour effectuer ou proposer une location.
        </p>
        <p>
          La Société se réserve le droit de suspendre ou de supprimer l'accès de tout utilisateur
          en cas de violation des présentes CGU, sans préavis ni indemnité.
        </p>
      </LegalSection>

      <LegalSection title="Article 3 — Inscription et compte utilisateur">
        <p>
          L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de
          son inscription. Toute usurpation d'identité ou fourniture de faux documents est
          strictement interdite et fera l'objet de poursuites judiciaires.
        </p>
        <p>
          L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion
          et de toutes les actions effectuées depuis son compte.
        </p>
      </LegalSection>

      <LegalSection title="Article 4 — Obligations des utilisateurs">
        <p>
          L'utilisateur s'engage à utiliser la plateforme conformément aux lois et règlements en
          vigueur, à ne pas porter atteinte aux droits de tiers et à ne pas diffuser de contenu
          illicite, trompeur ou abusif.
        </p>
        <p>
          Il est interdit de contourner les systèmes de paiement de SailingLoc en concluant des
          transactions directement avec d'autres utilisateurs.
        </p>
      </LegalSection>

      <LegalSection title="Article 5 — Réservations">
        <p>
          Toute réservation effectuée sur SailingLoc constitue un contrat entre le locataire et le
          propriétaire. SailingLoc agit en tant qu'intermédiaire et n'est pas partie au contrat de
          location.
        </p>
        <p>
          Le propriétaire dispose de 24 h pour accepter ou refuser une demande de réservation. En
          cas de silence, la réservation est automatiquement annulée.
        </p>
      </LegalSection>

      <LegalSection title="Article 6 — Paiements et commissions">
        <p>
          Les paiements sont traités de manière sécurisée par Stripe. SailingLoc perçoit une
          commission sur chaque transaction confirmée. Les montants exacts sont communiqués avant
          la confirmation de chaque réservation.
        </p>
        <p>
          Les remboursements en cas d'annulation sont soumis à la politique d'annulation définie
          par le propriétaire, telle qu'affichée sur l'annonce au moment de la réservation.
        </p>
      </LegalSection>

      <LegalSection title="Article 7 — Résiliation">
        <p>
          L'utilisateur peut supprimer son compte à tout moment depuis les paramètres de son profil.
          La résiliation entraîne la suppression des données personnelles dans les conditions prévues
          par la politique RGPD de SailingLoc.
        </p>
        <p>
          Les obligations financières nées avant la résiliation (réservations en cours, paiements
          à venir) restent dues.
        </p>
      </LegalSection>

      <LegalSection title="Article 8 — Droit applicable et juridiction">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, les parties
          s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut
          d'accord, les tribunaux compétents de Marseille seront saisis.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default Cgu
