import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Menu.css";

export default function Menu() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && closeMenu();
    if (open) {
      window.addEventListener("keydown", onEscape);
      return () => window.removeEventListener("keydown", onEscape);
    }
  }, [open]);

  return (
    <header className="menu">
      <div className="menu-header">
        <Link to="/" className="menu-logo" onClick={closeMenu}>
          Lumiel
        </Link>
        <button
          type="button"
          className={`menu-burger ${open ? "menu-burger--open" : ""}`}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <p className="menu-tagline">La lumière qui guide votre énergie</p>
      <nav className={`menu-nav ${open ? "menu-nav--open" : ""}`}>
        <Link to="/" onClick={closeMenu}>
          Accueil
        </Link>
        <Link to="/a-propos" onClick={closeMenu}>
          À propos
        </Link>
        <Link to="/prestations" onClick={closeMenu}>
          Prestations
        </Link>
        <Link to="/temoignages" onClick={closeMenu}>
          Témoignages
        </Link>
        <Link to="/blog" onClick={closeMenu}>
          Blog
        </Link>
        <Link to="/login" onClick={closeMenu} className="menu-login" aria-label="Connexion">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
      </nav>
      {open && (
        <div
          className="menu-overlay"
          onClick={closeMenu}
          role="button"
          tabIndex={-1}
          aria-label="Fermer le menu"
        />
      )}
    </header>
  );
}
