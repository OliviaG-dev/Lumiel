import { useState, useEffect } from 'react'
import { loadPrestations, addPrestation, updatePrestation, deletePrestation } from '@/lib/prestations'
import type { Prestation } from '@/types/prestation'
import PrestationFormModal from '@/components/prestation/PrestationFormModal'
import ConfirmModal from '@/components/confirm/ConfirmModal'
import { Button } from '@/components/button/Button'
import './PrestationsTab.css'

export default function PrestationsTab() {
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPrestation, setEditingPrestation] = useState<Prestation | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fetchPrestations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await loadPrestations()
      setPrestations(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrestations()
  }, [])

  const handleAdd = async (data: {
    nom: string
    description: string
    prix: number
    duree: number
    couleur: string
  }) => {
    await addPrestation(data)
    await fetchPrestations()
  }

  const handleUpdate = async (data: {
    nom: string
    description: string
    prix: number
    duree: number
    couleur: string
  }) => {
    if (!editingPrestation) return
    await updatePrestation(editingPrestation.id, data)
    setEditingPrestation(null)
    await fetchPrestations()
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return
    try {
      setActionLoading(confirmDeleteId)
      await deletePrestation(confirmDeleteId)
      await fetchPrestations()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression.')
    } finally {
      setActionLoading(null)
      setConfirmDeleteId(null)
    }
  }

  const formatPrix = (p: number) => (p === 0 ? '—' : `${p} €`)
  const formatDuree = (d: number) => `${d} min`

  if (loading) {
    return (
      <div className="dashboard-tab-content">
        <div className="dashboard-card">
          <div className="prestations-loading">Chargement des prestations…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-tab-content">
      <div className="dashboard-card">
        <header className="dashboard-page-header">
          <span className="dashboard-page-header-accent" aria-hidden="true" />
          <div className="dashboard-page-header-text">
            <h2 className="dashboard-page-title">Prestations</h2>
            <p className="dashboard-page-tagline">Catalogue et tarifs</p>
            <p className="dashboard-page-intro prestations-intro">
              Gérez les prestations proposées aux clients : nom, description, prix, durée et couleur
              (calendrier).
            </p>
          </div>
        </header>

        {error && (
          <div className="prestations-error">
            {error}
            <button type="button" onClick={() => setError(null)} aria-label="Fermer">×</button>
          </div>
        )}

        <div className="prestations-toolbar">
          <Button type="button" variant="primary" className="btn-prestation-add" onClick={() => setShowAddModal(true)}>
            + Ajouter une prestation
          </Button>
        </div>

        {prestations.length === 0 ? (
          <p className="dashboard-empty">Aucune prestation. Ajoutez-en une pour commencer.</p>
        ) : (
          <div className="prestations-list">
            {prestations.map((p) => (
              <div key={p.id} className="prestations-item">
                <div className="prestations-item-main">
                  <div className="prestations-item-header">
                    <span
                      className="prestations-item-color-dot"
                      style={{ background: p.couleur }}
                      title="Couleur calendrier"
                      aria-hidden
                    />
                    <span className="prestations-item-nom">{p.nom}</span>
                    <span className="prestations-item-meta">
                      {formatPrix(p.prix)} • {formatDuree(p.duree)}
                    </span>
                  </div>
                  {p.description && <p className="prestations-item-desc">{p.description}</p>}
                </div>
                <div className="prestations-item-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="prestations-btn-edit"
                    onClick={() => setEditingPrestation(p)}
                    disabled={actionLoading === p.id}
                    title="Modifier"
                    aria-label="Modifier"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="prestations-btn-delete"
                    onClick={() => setConfirmDeleteId(p.id)}
                    disabled={actionLoading === p.id}
                    title="Supprimer"
                    aria-label="Supprimer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <PrestationFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={fetchPrestations}
          saveFn={handleAdd}
        />

        <PrestationFormModal
          isOpen={!!editingPrestation}
          onClose={() => setEditingPrestation(null)}
          onSave={fetchPrestations}
          prestation={editingPrestation ?? undefined}
          saveFn={handleUpdate}
        />

        <ConfirmModal
          isOpen={!!confirmDeleteId}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={handleConfirmDelete}
          title="Supprimer la prestation"
          message="Supprimer définitivement cette prestation ?"
          confirmLabel="Supprimer"
          variant="danger"
        />
      </div>
    </div>
  )
}
