import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Client } from '../../types/client'
import { Button } from '../button/Button'
import './ClientFormModal.css'

export interface ClientFormFields {
  nom: string
  prenom: string
  email: string
  telephone: string
}

interface ClientFormModalProps {
  isOpen: boolean
  onClose: () => void
  client?: Client | null
  onSubmit: (data: ClientFormFields) => Promise<void>
}

export default function ClientFormModal({
  isOpen,
  onClose,
  client,
  onSubmit,
}: ClientFormModalProps) {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setNom(client?.nom ?? '')
      setPrenom(client?.prenom ?? '')
      setEmail(client?.email ?? '')
      setTelephone(client?.telephone ?? '')
      setError(null)
    }
  }, [isOpen, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = nom.trim()
    const p = prenom.trim()
    if (!n && !p) {
      setError('Indiquez au moins le prénom ou le nom.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      await onSubmit({
        nom: n,
        prenom: p,
        email: email.trim(),
        telephone: telephone.trim(),
      })
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
    <div className="client-modal-overlay" onClick={onClose}>
      <div className="client-modal" onClick={(e) => e.stopPropagation()}>
        <div className="client-modal-header">
          <h2>{client ? 'Modifier le client' : 'Ajouter un client'}</h2>
          <button type="button" className="client-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <form className="client-modal-body" onSubmit={handleSubmit}>
          {error && <p className="client-modal-error">{error}</p>}
          <div className="client-form-row">
            <label htmlFor="client-prenom">Prénom</label>
            <input
              id="client-prenom"
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="client-form-row">
            <label htmlFor="client-nom">Nom</label>
            <input
              id="client-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              autoComplete="family-name"
            />
          </div>
          <div className="client-form-row">
            <label htmlFor="client-email">E-mail</label>
            <input
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </div>
          <div className="client-form-row">
            <label htmlFor="client-telephone">Portable</label>
            <input
              id="client-telephone"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
          <p className="client-modal-hint">
            Les rendez-vous du calendrier sont rattachés à cette fiche lorsque l’e-mail ou le portable
            correspond à une réservation.
          </p>
          <div className="client-modal-actions">
            <Button type="button" variant="outline" className="btn-client-secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="btn-client-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : client ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return target ? createPortal(content, target) : content
}
