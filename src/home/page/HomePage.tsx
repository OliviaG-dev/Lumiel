import './HomePage.css'

export default function HomePage() {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="home-logo">Lumiel</h1>
        <p className="home-tagline">La lumière qui guide votre énergie</p>
        <nav className="home-nav">
          <a href="#accueil">Accueil</a>
          <a href="#apropos">À propos</a>
          <a href="#prestations">Prestations</a>
          <a href="#temoignages">Témoignages</a>
          <a href="#blog">Blog</a>
          <a href="#reservation" className="nav-cta">Réserver</a>
        </nav>
      </header>

      <main>
        <section id="accueil" className="hero-section">
          <div className="hero-content">
            <h2>Bienvenue dans l'univers Lumiel</h2>
            <p>
              Un espace dédié au bien-être, à l'harmonie intérieure et à l'équilibre des énergies.
              À travers une approche humaine et bienveillante, je vous accompagne pour relâcher
              les tensions, retrouver la sérénité et rééquilibrer votre énergie.
            </p>
            <a href="#reservation" className="btn-primary">Réserver une séance</a>
          </div>
        </section>

        <section id="apropos" className="about-section">
          <h2>Mon approche</h2>
          <p>
            Le magnétisme et les pratiques énergétiques offrent un accompagnement doux vers
            plus d'équilibre et de calme intérieur. Chaque séance est adaptée à vos besoins
            pour vous guider vers un mieux-être durable.
          </p>
        </section>

        <section id="prestations" className="services-section">
          <h2>Prestations & Tarifs</h2>
          <p>
            Découvrez les différentes prestations proposées et trouvez celle qui correspond
            à vos besoins. Les tarifs et disponibilités sont consultables sur la page dédiée.
          </p>
          <a href="#reservation" className="btn-secondary">Voir les disponibilités</a>
        </section>

        <section id="temoignages" className="testimonials-section">
          <h2>Témoignages</h2>
          <p>
            Les retours d'expérience de ceux qui ont déjà franchi la porte créent un espace
            de confiance. Découvrez les avis de ceux qui ont retrouvé sérénité et équilibre.
          </p>
        </section>

        <section id="blog" className="blog-section">
          <h2>Blog bien-être</h2>
          <p>
            Conseils et contenus autour du bien-être énergétique pour nourrir votre chemin
            vers l'harmonie intérieure.
          </p>
        </section>

        <section id="reservation" className="booking-section">
          <h2>Réserver une séance</h2>
          <p>
            Réservez facilement votre séance grâce au calendrier en ligne. Choisissez le
            créneau qui vous convient parmi les disponibilités du praticien.
          </p>
          <a href="#" className="btn-primary">Accéder au calendrier</a>
        </section>
      </main>

      <footer className="home-footer">
        <p>© Lumiel — La lumière qui guide votre énergie</p>
      </footer>
    </div>
  )
}
