import { Link } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <h1>Bienvenue</h1>
        <p>
          Un espace dédié au bien-être, à l'harmonie intérieure et à l'équilibre des énergies.
          À travers une approche humaine et bienveillante, je vous accompagne pour relâcher
          les tensions, retrouver la sérénité et rééquilibrer votre énergie.
        </p>
        <Link to="/prestations" className="btn-primary">Réserver une séance</Link>
      </section>
    </div>
  )
}
