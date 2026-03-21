import { useState } from 'react'
import { createPortal } from 'react-dom'
import './AvisModal.css'

const TYPES_SEANCE = ['Massage bien-être', 'Reiki', 'Soin énergétique', 'Consultation', 'Autre']

interface AvisModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: { prenom: string; nom: string; note: number; typeSeance: string; avis: string }) => void
}

export default function AvisModal({ isOpen, onClose, onSubmit }: AvisModalProps) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [note, setNote] = useState(0)
  const [typeSeance, setTypeSeance] = useState(TYPES_SEANCE[0])
  const [avis, setAvis] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!avis.trim()) return
    onSubmit?.({ prenom, nom, note: note || 0, typeSeance, avis: avis.trim() })
    setPrenom('')
    setNom('')
    setNote(0)
    setTypeSeance(TYPES_SEANCE[0])
    setAvis('')
    onClose()
  }

  const handleClose = () => {
    setPrenom('')
    setNom('')
    setNote(0)
    setTypeSeance(TYPES_SEANCE[0])
    setAvis('')
    onClose()
  }

  if (!isOpen) return null

  const target = document.getElementById('layout-main')
  const content = (
    <div className="avis-modal-overlay" onClick={handleClose}>
      <div className="avis-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avis-modal-header">
          <h2>Rédiger un avis</h2>
          <button type="button" className="avis-modal-close" onClick={handleClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <form className="avis-modal-body" onSubmit={handleSubmit}>
          <div className="avis-form-row">
            <label htmlFor="avis-prenom">Prénom</label>
            <input
              id="avis-prenom"
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Marie"
              autoComplete="given-name"
            />
          </div>
          <div className="avis-form-row">
            <label htmlFor="avis-nom">Nom</label>
            <input
              id="avis-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Dupont"
              autoComplete="family-name"
            />
          </div>
          <div className="avis-form-row avis-form-row--inline">
            <div className="avis-form-group">
              <label>Note</label>
              <div className="avis-stars" role="group" aria-label="Note de 1 à 5 étoiles">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`avis-star ${note >= n ? 'avis-star--filled' : ''}`}
                    onClick={() => setNote(n)}
                    aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    aria-pressed={note >= n}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="avis-form-group">
              <label htmlFor="avis-type-seance">Type de séance</label>
              <select
                id="avis-type-seance"
                value={typeSeance}
                onChange={(e) => setTypeSeance(e.target.value)}
              >
                {TYPES_SEANCE.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="avis-form-row">
            <label htmlFor="avis-texte">Votre avis</label>
            <textarea
              id="avis-texte"
              value={avis}
              onChange={(e) => setAvis(e.target.value)}
              placeholder="Partagez votre expérience..."
              rows={3}
              required
            />
          </div>
          <div className="avis-form-actions">
            <button type="button" className="btn-avis-secondary" onClick={handleClose}>
              Annuler
            </button>
            <button type="submit" className="btn-avis-primary">
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return target ? createPortal(content, target) : content
}
