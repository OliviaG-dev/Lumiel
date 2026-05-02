import { Link } from 'react-router-dom'
import { LEGAL_CONTROLLER } from '@/config/legal'
import './ConfidentialitePage.css'

export default function ConfidentialitePage() {
  return (
    <div className="confidentialite-page">
      <section className="confidentialite-content">
        <h1>Politique de confidentialité</h1>
        <p className="confidentialite-lead">
          La présente politique décrit comment des données personnelles sont traitées lors de la
          visite du site Lumiel et de l’utilisation de ses fonctionnalités, conformément au Règlement
          général sur la protection des données (RGPD) et à la loi française applicable.
        </p>

        <div className="confidentialite-section">
          <h2>1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données est : <strong>{LEGAL_CONTROLLER.name}</strong>.
          </p>
          <p>
            Adresse : {LEGAL_CONTROLLER.address}
            <br />
            Pour toute question relative à vos données :{' '}
            <a href={`mailto:${LEGAL_CONTROLLER.email}`} className="confidentialite-mail">
              {LEGAL_CONTROLLER.email}
            </a>
          </p>
        </div>

        <div className="confidentialite-section">
          <h2>2. Données collectées et finalités</h2>
          <ul className="confidentialite-list">
            <li>
              <strong>Formulaire de contact</strong> : nom, adresse e-mail et contenu du message.
              <br />
              <em>Finalité :</em> répondre à votre demande. <em>Base légale :</em> votre consentement
              ou l’exécution de mesures précontractuelles à votre demande.
            </li>
            <li>
              <strong>Demande de réservation</strong> : nom, prénom, e-mail, téléphone éventuel,
              prestation, créneau, commentaires.
              <br />
              <em>Finalité :</em> gestion des rendez-vous et suivi de la relation client.
              <em> Base légale :</em> exécution du service demandé ou mesures précontractuelles.
            </li>
            <li>
              <strong>Témoignage / avis</strong> : prénom, nom (éventuellement partiel), type de
              séance, texte et note.
              <br />
              <em>Finalité :</em> affichage public après modération sur la page Témoignages.
              <em> Base légale :</em> votre consentement explicite au moment de l’envoi.
            </li>
            <li>
              <strong>Espace d’administration (tableau de bord)</strong> : données de compte
              fournies par le prestataire d’authentification (adresse e-mail, identifiant technique),
              ainsi que les données métier saisies dans l’outil (clients, réservations, articles, etc.).
              <br />
              <em>Finalité :</em> administration du site et du planning.{' '}
              <em>Base légale :</em> intérêt légitime ou obligation contractuelle / exécution des
              prestations selon le cas.
            </li>
            <li>
              <strong>Données de navigation techniques</strong> : journaux côté hébergement ou
              prestataires techniques (adresse IP, type de navigateur, horodatage) dans les limites
              nécessaires à la sécurité et au bon fonctionnement du service.
            </li>
          </ul>
        </div>

        <div className="confidentialite-section">
          <h2>3. Destinataires et sous-traitants</h2>
          <p>
            Les données peuvent être traitées par des prestataires agissant sur instruction, notamment
            :
          </p>
          <ul className="confidentialite-list">
            <li>
              <strong>Supabase</strong> (hébergement base de données, authentification, API) —
              informations selon leur politique :{' '}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="confidentialite-ext"
              >
                supabase.com/privacy
              </a>
            </li>
            <li>
              <strong>Service d’envoi du formulaire de contact</strong> (ex. relais e-mail tiers) —
              uniquement pour acheminer votre message vers la boîte du responsable.
            </li>
            <li>
              <strong>Google Fonts</strong> : chargement de polices depuis les serveurs Google peut
              entraîner la communication d’informations techniques (par ex. adresse IP) à Google,
              conformément à leur politique.
            </li>
          </ul>
          <p>
            Aucune vente de données personnelles n’est effectuée. Les transferts hors Union européenne,
            le cas échéant, s’effectuent avec garanties appropriées (clauses types, etc.) lorsque
            requis.
          </p>
        </div>

        <div className="confidentialite-section">
          <h2>4. Durées de conservation</h2>
          <p>
            Les données sont conservées pendant la durée nécessaire aux finalités ci-dessus : par
            exemple, messages de contact le temps du traitement de la demande ; données de
            réservation pour la gestion du planning et les obligations comptables ou légales le cas
            échéant ; compte administrateur tant qu’il est actif. Des délais d’effacement ou
            d’anonymisation peuvent être appliqués lorsque la conservation n’est plus justifiée.
          </p>
        </div>

        <div className="confidentialite-section">
          <h2>5. Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez des droits suivants, dans les conditions prévues par la
            loi : accès, rectification, effacement, limitation du traitement, opposition (notamment à
            la prospection), portabilité lorsque applicable, et retrait du consentement lorsque le
            traitement en dépend.
          </p>
          <p>
            Vous pouvez exercer ces droits en écrivant à{' '}
            <a href={`mailto:${LEGAL_CONTROLLER.email}`} className="confidentialite-mail">
              {LEGAL_CONTROLLER.email}
            </a>
            . Une pièce d’identité peut être demandée si nécessaire pour vérifier votre identité.
          </p>
          <p>
            Vous pouvez introduire une réclamation auprès de l’autorité de contrôle compétente ; en
            France : la{' '}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="confidentialite-ext"
            >
              CNIL
            </a>
            .
          </p>
        </div>

        <div className="confidentialite-section">
          <h2>6. Cookies et traceurs</h2>
          <p>
            Des cookies ou stockages locaux strictement nécessaires peuvent être utilisés pour le
            fonctionnement de la session (par exemple connexion à l’espace d’administration). Les
            autres usages sont décrits dans le bandeau d’information présent lors de votre première
            visite. Vous pouvez configurer votre navigateur pour limiter les cookies ; certaines
            fonctions pourraient alors être dégradées.
          </p>
        </div>

        <div className="confidentialite-section">
          <h2>7. Sécurité</h2>
          <p>
            Des mesures techniques et organisationnelles appropriées sont mises en œuvre pour protéger
            les données contre l’accès non autorisé, la perte ou l’altération, dans la mesure du
            raisonnable compte tenu de la nature du site.
          </p>
        </div>

        <div className="confidentialite-section">
          <h2>8. Modifications</h2>
          <p>
            Cette politique peut être mise à jour pour refléter l’évolution du site ou des obligations
            légales. La date de dernière mise à jour peut être indiquée ci-dessous. En cas de changement
            substantiel, un avis pourra être affiché sur le site.
          </p>
          <p className="confidentialite-updated">Dernière mise à jour : mars 2026.</p>
        </div>

        <p className="confidentialite-back">
          <Link to="/contact" className="confidentialite-inline-link">
            Contact &amp; FAQ
          </Link>
          {' · '}
          <Link to="/" className="confidentialite-inline-link">
            Accueil
          </Link>
        </p>
      </section>
    </div>
  )
}
