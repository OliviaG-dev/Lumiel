import { Link } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <p className="home-kicker">Bien-être &amp; harmonisation</p>
        <h1 id="home-title">Un espace pour retrouver votre équilibre</h1>
        <p className="home-lead">
          Ici, vous êtes accueilli·e dans la bienveillance, sans jugement ni promesse irréaliste —
          pour relâcher la pression et gagner en ancrage au quotidien.
        </p>
        <p className="home-support">
          Pause, recentrage ou période de transition : chaque séance s’aligne sur vos besoins et
          votre rythme.
        </p>
        <div className="home-actions">
          <Link className="home-btn home-btn--primary" to="/prestations">
            Découvrir les prestations
          </Link>
          <Link className="home-btn home-btn--secondary" to="/a-propos">
            Mon approche
          </Link>
        </div>
      </section>
    </div>
  )
}
