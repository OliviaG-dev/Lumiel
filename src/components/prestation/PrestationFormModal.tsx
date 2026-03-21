import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Prestation } from '../../types/prestation'
import './PrestationFormModal.css'

interface PrestationFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  prestation?: Prestation | null
  saveFn: (data: { nom: string; description: string; prix: number; duree: number }) => Promise<void>
}

export default function PrestationFormModal({
  isOpen,
  onClose,
  onSave,
  prestation,
  saveFn,
}: PrestationFormModalProps) {
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [prix, setPrix] = useState(0)
  const [duree, setDuree] = useState(60)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setNom(prestation?.nom ?? '')
      setDescription(prestation?.description ?? '')
      setPrix(prestation?.prix ?? 0)
      setDuree(prestation?.duree ?? 60)
      setError(null)
    }
  }, [isOpen, prestation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nomTrim = nom.trim()
    if (!nomTrim) {
      setError('Le nom est requis.')
      return
    }
    if (prix < 0 || duree <= 0) {
      setError('Prix et durée doivent être positifs.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      await saveFn({ nom: nomTrim, description: description.trim(), prix, duree })
      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const target = document.getElementById('layout-main')
  const content = (
    <div className="prestation-modal-overlay" onClick={onClose}>
      <div className="prestation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prestation-modal-header">
          <h2>{prestation ? 'Modifier la prestation' : 'Ajouter une prestation'}</h2>
          <button type="button" className="prestation-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <form className="prestation-modal-body" onSubmit={handleSubmit}>
          {error && <p className="prestation-modal-error">{error}</p>}
          <div className="prestation-form-row">
            <label htmlFor="prestation-nom">Nom *</label>
            <input
              id="prestation-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Massage bien-être"
              required
            />
          </div>
          <div className="prestation-form-row">
            <label htmlFor="prestation-description">Description</label>
            <textarea
              id="prestation-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez la prestation..."
              rows={2}
            />
          </div>
          <div className="prestation-form-row prestation-form-row--inline">
            <div className="prestation-form-group">
              <label htmlFor="prestation-prix">Prix (€) *</label>
              <input
                id="prestation-prix"
                type="number"
                min="0"
                step="0.01"
                value={prix}
                onChange={(e) => setPrix(Number(e.target.value))}
                required
              />
            </div>
            <div className="prestation-form-group">
              <label htmlFor="prestation-duree">Durée (min) *</label>
              <input
                id="prestation-duree"
                type="number"
                min="5"
                step="5"
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
                required
              />
            </div>
          </div>
          <div className="prestation-modal-actions">
            <button type="button" className="btn-prestation-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-prestation-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : prestation ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return target ? createPortal(content, target) : content
}
