import { Link } from "react-router-dom"
import "./SiteFooter.css"

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="site-footer-nav" aria-label="Informations légales">
        <Link to="/confidentialite">Confidentialité &amp; données personnelles</Link>
      </nav>
    </footer>
  )
}
