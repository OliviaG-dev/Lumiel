import { useState, useEffect } from 'react'
import BookingModal from '../../components/booking/BookingModal'
import { loadPrestations } from '../../lib/prestations'
import type { Prestation } from '../../types/prestation'
import './PrestationsPage.css'

export default function PrestationsPage() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrestations()
      .then((data) => {
        setPrestations(data)
        setError(null)
      })
      .catch((err) => {
        console.error('Erreur chargement prestations:', err)
        setPrestations([])
        setError('Impossible de charger les prestations.')
      })
      .finally(() => setLoading(false))
  }, [])

  const formatPrix = (p: number) => (p === 0 ? 'Sur devis' : `${p} €`)
  const formatDuree = (d: number) => `${d} min`

  return (
    <div className="prestations-page">
      <section className="prestations-content">
        <h1>Prestations & Tarifs</h1>
        <p>
          Découvrez les différentes prestations proposées et trouvez celle qui correspond
          à vos besoins. Les tarifs et disponibilités sont consultables ci-dessous.
        </p>

        {loading ? (
          <p className="prestations-loading">Chargement des prestations…</p>
        ) : prestations.length > 0 ? (
          <div className="prestations-list-public">
            {prestations.map((p) => (
              <div
                key={p.id}
                className="prestation-card"
                style={{ borderLeftColor: p.couleur }}
              >
                <h3 className="prestation-card-nom">{p.nom}</h3>
                {p.description && <p className="prestation-card-desc">{p.description}</p>}
                <div className="prestation-card-meta">
                  <span className="prestation-card-prix">{formatPrix(p.prix)}</span>
                  <span className="prestation-card-duree">{formatDuree(p.duree)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={error ? 'prestations-error' : 'prestations-empty'}>
            {error ?? 'Aucune prestation disponible pour le moment.'}
          </p>
        )}

        <div id="reservation" className="prestations-booking">
          <h2>Réserver une séance</h2>
          <p>
            Réservez facilement votre séance grâce au calendrier en ligne. Choisissez le
            créneau qui vous convient parmi les disponibilités du praticien.
          </p>
          <button type="button" className="btn-primary" onClick={() => setBookingOpen(true)}>
            Réserver une séance
          </button>
        </div>
      </section>

      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  )
}
