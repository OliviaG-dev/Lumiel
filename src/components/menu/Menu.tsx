import { Link } from 'react-router-dom'
import './Menu.css'

export default function Menu() {
  return (
    <header className="menu">
      <div className="menu-bg">
        <span className="menu-orb menu-orb--1" aria-hidden />
        <span className="menu-orb menu-orb--2" aria-hidden />
        <span className="menu-orb menu-orb--3" aria-hidden />
        <span className="menu-orb menu-orb--4" aria-hidden />
      </div>
      <Link to="/" className="menu-logo">Lumiel</Link>
      <p className="menu-tagline">La lumière qui guide votre énergie</p>
      <nav className="menu-nav">
        <Link to="/">Accueil</Link>
        <Link to="/a-propos">À propos</Link>
        <Link to="/prestations">Prestations</Link>
        <Link to="/temoignages">Témoignages</Link>
        <Link to="/blog">Blog</Link>
      </nav>
    </header>
  )
}
