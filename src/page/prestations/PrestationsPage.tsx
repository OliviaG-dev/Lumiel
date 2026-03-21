import { useState } from 'react'
import BookingModal from '../../components/booking/BookingModal'
import './PrestationsPage.css'

export default function PrestationsPage() {
  const [bookingOpen, setBookingOpen] = useState(false)

  return (
    <div className="prestations-page">
      <section className="prestations-content">
        <h1>Prestations & Tarifs</h1>
        <p>
          Découvrez les différentes prestations proposées et trouvez celle qui correspond
          à vos besoins. Les tarifs et disponibilités sont consultables ci-dessous.
        </p>

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
