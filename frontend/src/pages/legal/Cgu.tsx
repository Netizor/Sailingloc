import React from 'react'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

const Cgu: React.FC = () => {
  usePageTitle("Conditions Générales d'Utilisation")

  return (
    <LegalPageLayout
      title="Conditions Générales d'Utilisation"
      lastUpdated="Dernière mise à jour : 16 juillet 2026"
    >
      <LegalSection title="Article 1 - Objet">
        <p>
          Les présentes CGU régissent l'accès et l'utilisation de la plateforme SailingLoc,
          accessible à l'adresse sailingloc.fr, éditée par SailingLoc SAS. SailingLoc est une
          plateforme de mise en relation permettant aux particuliers inscrits d'établir des
          contrats de location de voiliers et de bateaux à moteur, en France, en Europe et à
          l'international. En accédant à la plateforme, l'utilisateur accepte sans réserve les
          présentes CGU.
        </p>
      </LegalSection>

      <LegalSection title="Article 2 - Nature du service">
        <p>
          SailingLoc agit exclusivement en qualité d'intermédiaire technique. Les locations sont
          conclues uniquement entre particuliers inscrits. SailingLoc n'est pas propriétaire des
          bateaux proposés et n'est pas partie au contrat de location, sauf pour les services de
          mise en relation, de paiement et de support associés à la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="Article 3 - Accès à la plateforme">
        <p>
          La consultation du site est libre. L'inscription est obligatoire pour louer un bateau,
          publier une annonce ou conclure un contrat de location. L'accès est réservé aux
          personnes physiques majeures. La Société se réserve le droit de suspendre tout
          utilisateur en cas de violation des CGU.
        </p>
      </LegalSection>

      <LegalSection title="Article 4 - Inscription et compte utilisateur">
        <p>
          L'utilisateur s'engage à fournir des informations exactes et à jour. Toute usurpation
          d'identité est interdite. L'utilisateur est seul responsable de la confidentialité de
          ses identifiants. Seuls les comptes inscrits et actifs peuvent établir des contrats de
          location via la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="Article 5 - Obligations des utilisateurs">
        <p>
          L'utilisateur s'engage à utiliser la plateforme conformément aux lois en vigueur et à
          n'y proposer que des locations entre particuliers. Il est interdit de contourner les
          systèmes de paiement de SailingLoc ou d'utiliser la plateforme pour une activité
          professionnelle de location non déclarée comme telle.
        </p>
      </LegalSection>

      <LegalSection title="Article 6 - Réservations et contrats de location">
        <p>
          Toute réservation confirmée constitue un contrat de location entre le locataire et le
          propriétaire, tous deux particuliers inscrits. SailingLoc agit en tant
          qu'intermédiaire. Le propriétaire dispose de 24 h pour accepter ou refuser une demande.
          En cas de silence, la réservation est annulée automatiquement.
        </p>
      </LegalSection>

      <LegalSection title="Article 7 - Paiements et commissions">
        <p>
          Les paiements sont traités par Stripe. SailingLoc encaisse 10 % de chaque transaction
          confirmée au titre des frais de service de la plateforme. Le montant exact est affiché
          avant la confirmation de la réservation. Les remboursements sont soumis à la politique
          d'annulation du propriétaire.
        </p>
      </LegalSection>

      <LegalSection title="Article 8 - Assurance">
        <p>
          Chaque propriétaire s'engage à disposer d'une assurance navigation valide couvrant la
          location à des tiers. SailingLoc peut collaborer avec des partenaires assurance ; cela
          ne dispense pas le propriétaire de ses obligations, ni le locataire de vérifier les
          conditions de couverture avant le départ.
        </p>
      </LegalSection>

      <LegalSection title="Article 9 - Résiliation">
        <p>
          L'utilisateur peut supprimer son compte depuis ses paramètres. Les obligations
          financières nées avant la résiliation restent dues.
        </p>
      </LegalSection>

      <LegalSection title="Article 10 - Droit applicable">
        <p>
          Les CGU sont soumises au droit français. En cas de litige, les tribunaux compétents de
          Marseille seront saisis.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default Cgu
