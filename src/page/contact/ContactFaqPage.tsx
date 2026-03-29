import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/button/Button'
import './ContactFaqPage.css'

/** Boîte qui reçoit les messages (relai via formSubmit.co — activation par e-mail au premier envoi). */
const CONTACT_RECIPIENT = 'test.tesing.tester.testeur@gmail.com'

const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_RECIPIENT)}`

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Comment prendre rendez-vous ?',
    a: 'Les créneaux et types de séance sont présentés sur la page Prestations. Vous pouvez envoyer une demande depuis le formulaire de réservation : je vous confirme généralement sous quelques jours.',
  },
  {
    q: 'Puis-je modifier ou annuler un rendez-vous ?',
    a: 'Oui. Merci de prévenir le plus tôt possible par e-mail pour qu’on trouve une alternative qui vous convienne. Des délais trop courts peuvent empêcher de proposer le créneau à quelqu’un d’autre.',
  },
  {
    q: 'Que se passe-t-il lors d’une première séance ?',
    a: 'Un temps d’échange permet de clarifier votre attente du moment et le déroulé qui vous convient. La suite de la séance dépend de la prestation choisie ; vous pouvez à tout moment exprimer un inconfort ou demander d’adapter le rythme.',
  },
  {
    q: 'Les soins remplacent-ils un suivi médical ?',
    a: 'Non. L’accompagnement proposé relève du bien-être et ne se substitue pas à un avis médical, un diagnostic ou un traitement. En cas de symptômes inquiétants ou de pathologie suivie, il est important de consulter un professionnel de santé.',
  },
  {
    q: 'Comment sont gérées la confidentialité et les données ?',
    a: 'Les échanges dans le cadre des séances sont traités avec discrétion. Les informations nécessaires à la réservation (coordonnées, etc.) servent uniquement à l’organisation des rendez-vous, dans le respect du cadre légal applicable.',
  },
  {
    q: 'Proposez-vous des séances à distance ?',
    a: 'Cela dépend des prestations affichées sur le site. Si une formule à distance est proposée, les modalités sont précisées sur la fiche prestation ; sinon, merci de me le demander par e-mail pour vérifier ce qui est possible.',
  },
]

type SendStatus = 'idle' | 'sending' | 'success' | 'error'

async function submitContactMessage(body: { name: string; email: string; message: string }) {
  const params = new URLSearchParams()
  params.set('name', body.name)
  params.set('email', body.email)
  params.set('message', body.message)
  params.set('_subject', 'Lumiel — message depuis la page Contact')
  params.set('_replyto', body.email)
  params.set('_template', 'table')
  params.set('_gotcha', '')

  const res = await fetch(FORMSUBMIT_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: params.toString(),
  })

  let data: { success?: boolean; message?: string } = {}
  try {
    data = (await res.json()) as { success?: boolean; message?: string }
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    throw new Error(data.message ?? "L'envoi a échoué. Réessayez plus tard.")
  }
  if (typeof data.success === 'boolean' && data.success === false) {
    throw new Error(data.message ?? "L'envoi a échoué. Réessayez plus tard.")
  }
}

export default function ContactFaqPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<SendStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setStatus('sending')
    try {
      await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      })
      setStatus('success')
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : "L'envoi a échoué.")
    }
  }

  return (
    <div className="contact-page">
      <section className="contact-content">
        <h1>Contact & FAQ</h1>
        <p className="contact-lead">
          Une question avant de réserver, ou besoin d’un précision ? Retrouvez ci-dessous les réponses aux demandes les plus fréquentes, et un formulaire pour m’écrire.
        </p>

        <div className="contact-section">
          <h2>Me contacter</h2>
          <p>
            Pour toute demande hors formulaire de réservation (question sur une prestation, créneau particulier,
            accompagnement sur plusieurs séances), envoyez un message via le formulaire ci-dessous.
          </p>

          {status === 'success' ? (
            <div className="contact-form-success-block">
              <p className="contact-form-success" role="status">
                Merci, votre message a bien été envoyé. Je vous réponds en général sous 2 à 3 jours ouvrés.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus('idle')
                  setErrorMessage(null)
                }}
              >
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
              <div className="contact-form-row">
                <label htmlFor="contact-name">Nom</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={status === 'sending'}
                  placeholder="Votre nom"
                />
              </div>
              <div className="contact-form-row">
                <label htmlFor="contact-email">E-mail</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'sending'}
                  placeholder="vous@exemple.fr"
                />
              </div>
              <div className="contact-form-row">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  maxLength={4000}
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={status === 'sending'}
                  placeholder="Votre question ou message…"
                />
              </div>
              {errorMessage ? (
                <p className="contact-form-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <Button type="submit" variant="primary" block disabled={status === 'sending'}>
                {status === 'sending' ? 'Envoi en cours…' : 'Envoyer le message'}
              </Button>
            </form>
          )}

          <p className="contact-hint">
            Pour une réservation rapide, passez par{' '}
            <Link to="/prestations" className="contact-inline-link">
              Prestations
            </Link>
            .
          </p>
        </div>

        <div className="contact-section contact-section--faq">
          <h2>Questions fréquentes</h2>
          <p className="contact-faq-intro">
            Cliquez sur une question pour afficher la réponse.
          </p>
          <div className="contact-faq-list">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="contact-faq-item">
                <summary className="contact-faq-q">{item.q}</summary>
                <p className="contact-faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="contact-section contact-section--closing">
          <h2>Envie d’en savoir plus sur la pratique ?</h2>
          <p>
            La page <Link to="/a-propos" className="contact-inline-link">À propos</Link> détaille le cadre d’accompagnement
            et l’esprit des séances.
          </p>
        </div>
      </section>
    </div>
  )
}
