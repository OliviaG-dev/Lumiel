import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { hasCookieInfoAck, setCookieInfoAck } from '@/lib/rgpdStorage'
import "./CookieConsent.css"

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!hasCookieInfoAck())
  }, [])

  const accept = () => {
    setCookieInfoAck()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title" aria-live="polite">
      <div className="cookie-consent-inner">
        <p id="cookie-consent-title" className="cookie-consent-text">
          Ce site utilise des cookies strictement nécessaires au fonctionnement (session sur l’espace
          connecté) et peut charger des polices depuis Google Fonts. Pour en savoir plus sur les
          traitements de données, consultez la{" "}
          <Link to="/confidentialite" className="cookie-consent-link">
            politique de confidentialité
          </Link>
          .
        </p>
        <button type="button" className="cookie-consent-btn" onClick={accept}>
          J’ai compris
        </button>
      </div>
    </div>
  )
}
