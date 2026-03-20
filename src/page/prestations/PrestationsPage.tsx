import './PrestationsPage.css'

export default function PrestationsPage() {
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
          <a href="#" className="btn-primary">Accéder au calendrier</a>
        </div>
      </section>
    </div>
  )
}
