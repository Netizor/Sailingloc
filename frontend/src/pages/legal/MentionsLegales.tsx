import React from 'react'
import { Link } from 'react-router-dom'
import LegalSection from '../../components/ui/LegalSection'
import LegalPageLayout from '../../components/ui/LegalPageLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

// ─── Page Mentions légales ─────────────────────────────────────────────────────

const MentionsLegales: React.FC = () => {
  // #6 - Titre de l'onglet pour le SEO et l'accessibilité
  usePageTitle('Mentions légales')

  return (
    // #7 - badge <span> (cohérence via PageHero)  #8 - boilerplate hero + carte extrait dans LegalPageLayout
    <LegalPageLayout
      title="Mentions légales"
      lastUpdated="Dernière mise à jour : 1er janvier 2026"
    >
      <LegalSection title="Éditeur du site">
        <p>
          Le site sailingloc.fr est édité par la société <strong>SailingLoc SAS</strong>, société par
          actions simplifiée au capital de 10 000 €, immatriculée au Registre du Commerce et des
          Sociétés de Marseille sous le numéro RCS 123 456 789.
        </p>
        <p>Siège social : 12 Quai de la Joliette, 13002 Marseille, France.</p>
        <p>
          Directeur de la publication : Lucas Martin, Président de SailingLoc SAS.
          <br />
          Contact : contact@sailingloc.fr
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 900,
          San Francisco, CA 94104, USA - pour le frontend.
        </p>
        <p>
          Le backend est hébergé par <strong>Railway Corp.</strong>, 340 S Lemon Ave #4133,
          Walnut, CA 91789, USA.
        </p>
        <p>
          Les médias (photos de bateaux) sont hébergés par <strong>Cloudinary Ltd.</strong>,
          3400 Central Expy Suite 110, Santa Clara, CA 95051, USA.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L'ensemble des éléments du site (textes, images, logos, graphismes, code source) est la
          propriété exclusive de SailingLoc SAS, sauf mention contraire.
        </p>
        <p>
          Toute reproduction, représentation, modification ou exploitation, totale ou partielle, des
          contenus du site, par quelque procédé que ce soit, sans autorisation expresse et préalable
          de SailingLoc SAS, est strictement interdite et constituerait une contrefaçon au sens des
          articles L.335-2 et suivants du Code de la Propriété Intellectuelle.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le site utilise des cookies à des fins techniques, analytiques et publicitaires. Pour en
          savoir plus, consultez notre{' '}
          <Link to="/cookies" className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2">
            Politique de cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Protection des données - CNIL">
        <p>
          Conformément à la loi n° 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers
          et aux libertés (loi Informatique et Libertés) et au Règlement général sur la protection
          des données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et
          de portabilité de vos données personnelles.
        </p>
        <p>
          Pour exercer ces droits, adressez votre demande à :{' '}
          <a
            href="mailto:dpo@sailingloc.fr"
            className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2"
          >
            dpo@sailingloc.fr
          </a>
          .
        </p>
        <p>
          Pour plus d'informations, consultez notre{' '}
          <Link to="/rgpd" className="text-ocean-700 hover:text-ocean-900 underline underline-offset-2">
            Politique RGPD
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}

export default MentionsLegales
