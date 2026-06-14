import React from 'react'
import { Shield } from 'lucide-react'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

// ─── Page RGPD ────────────────────────────────────────────────────────────────

const Rgpd: React.FC = () => {
  // #6 - Titre de l'onglet pour le SEO et l'accessibilité
  usePageTitle('Politique RGPD')

  return (
    // #7 - badge <span> (cohérence via PageHero)  #8 - boilerplate hero + carte extrait dans LegalPageLayout
    <LegalPageLayout
      icon={Shield}
      badge="Légal"
      title="Politique de protection des données (RGPD)"
      lastUpdated="Dernière mise à jour : 1er janvier 2026"
    >
      <LegalSection title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données personnelles est <strong>SailingLoc SAS</strong>,
          12 Quai de la Joliette, 13002 Marseille - contact@sailingloc.fr.
        </p>
        <p>
          Délégué à la Protection des Données (DPO) : dpo@sailingloc.fr.
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <p>SailingLoc collecte les données suivantes :</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Données d'identité : nom, prénom, date de naissance, pièce d'identité</li>
          <li>Données de contact : adresse e-mail, numéro de téléphone</li>
          <li>Données de compte : identifiant, rôle (locataire / propriétaire)</li>
          <li>Données financières : IBAN (propriétaires), informations de carte (via Stripe)</li>
          <li>Données de navigation : adresse IP, pages visitées, cookies techniques</li>
          <li>Contenu généré : annonces, avis, messages, photos de bateaux</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalités du traitement">
        <p>Les données sont traitées pour les finalités suivantes :</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Gestion des comptes utilisateurs et authentification</li>
          <li>Mise en relation locataires / propriétaires et gestion des réservations</li>
          <li>Traitement des paiements et versements via Stripe</li>
          <li>Envoi de notifications transactionnelles (confirmation, rappel, avis)</li>
          <li>Prévention de la fraude et sécurité de la plateforme</li>
          <li>Amélioration du service (analyses statistiques anonymisées)</li>
          <li>Respect des obligations légales et fiscales</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Durée de conservation">
        <p>
          Les données sont conservées pour la durée strictement nécessaire aux finalités pour
          lesquelles elles ont été collectées :
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Données de compte actif : pendant toute la durée de la relation contractuelle</li>
          <li>Données de compte supprimé : 3 ans après la suppression (obligations légales)</li>
          <li>Données de paiement : 5 ans (Code de commerce)</li>
          <li>Logs de navigation : 12 mois maximum</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Vos droits">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Droit d'accès à vos données personnelles</li>
          <li>Droit de rectification en cas d'inexactitude</li>
          <li>Droit à l'effacement (« droit à l'oubli »)</li>
          <li>Droit à la portabilité de vos données</li>
          <li>Droit d'opposition au traitement</li>
          <li>Droit à la limitation du traitement</li>
        </ul>
        <p>
          Vous pouvez également déposer une réclamation auprès de la CNIL (Commission Nationale de
          l'Informatique et des Libertés) sur{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2"
          >
            www.cnil.fr
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Transferts hors Union européenne">
        <p>
          Certains de nos sous-traitants sont établis en dehors de l'Union européenne et peuvent
          être amenés à traiter vos données personnelles :
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Vercel Inc.</strong> (USA) - hébergement du frontend.
            Transfert encadré par les Clauses Contractuelles Types (CCT) approuvées par la Commission
            européenne.
          </li>
          <li>
            <strong>Railway Corp.</strong> (USA) - hébergement du backend.
            Transfert encadré par les CCT.
          </li>
          <li>
            <strong>Cloudinary Ltd.</strong> (USA) - stockage des photos (bateaux, avatars, documents KYC).
            Transfert encadré par les CCT.
          </li>
          <li>
            <strong>Stripe Inc.</strong> (USA) - traitement des paiements.
            Certifié PCI-DSS ; transfert encadré par les CCT.
          </li>
          <li>
            <strong>Resend Inc.</strong> (USA) - envoi des e-mails transactionnels.
            Transfert encadré par les CCT.
          </li>
        </ul>
        <p>
          Pour obtenir une copie des garanties mises en place, contactez notre DPO à{' '}
          <a href="mailto:dpo@sailingloc.fr" className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2">
            dpo@sailingloc.fr
          </a>.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact DPO">
        <p>
          Pour exercer vos droits ou pour toute question relative à la protection de vos données,
          contactez notre DPO à l'adresse suivante :{' '}
          <a
            href="mailto:dpo@sailingloc.fr"
            className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2"
          >
            dpo@sailingloc.fr
          </a>
          . Nous nous engageons à répondre dans un délai d'un mois.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default Rgpd
