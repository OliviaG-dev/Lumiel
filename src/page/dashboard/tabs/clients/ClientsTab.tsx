import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  loadClients,
  addClient,
  updateClient,
  deleteClient,
  loadSeanceNotes,
  addSeanceNote,
  deleteSeanceNote,
} from '../../../../lib/clients'
import { loadReservations } from '../../../../lib/reservations'
import { reservationMatchesClient } from '../../../../lib/clientRendezVousMatch'
import type { Client } from '../../../../types/client'
import type { Reservation } from '../../../../types/reservation'
import ClientFormModal from '../../../../components/client/ClientFormModal'
import ConfirmModal from '../../../../components/confirm/ConfirmModal'
import './ClientsTab.css'

function formatRdvDate(d: Date) {
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatNoteDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftFicheNotes, setDraftFicheNotes] = useState('')
  const [seanceNotes, setSeanceNotes] = useState<Awaited<ReturnType<typeof loadSeanceNotes>>>([])
  const [loading, setLoading] = useState(true)
  const [notesLoading, setNotesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [confirmDeleteClientId, setConfirmDeleteClientId] = useState<string | null>(null)
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null)

  const [newSeanceContent, setNewSeanceContent] = useState('')
  const [newSeanceDate, setNewSeanceDate] = useState('')

  const fetchClientsAndReservations = useCallback(async () => {
    const [c, r] = await Promise.all([loadClients(), loadReservations()])
    setClients(c)
    setReservations(r)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        await fetchClientsAndReservations()
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur lors du chargement des clients.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchClientsAndReservations])

  const selected = useMemo(
    () => clients.find((c) => c.id === selectedId) ?? null,
    [clients, selectedId],
  )

  useEffect(() => {
    if (!selectedId) {
      setSeanceNotes([])
      return
    }
    let cancelled = false
    ;(async () => {
      setNotesLoading(true)
      try {
        const n = await loadSeanceNotes(selectedId)
        if (!cancelled) setSeanceNotes(n)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur lors du chargement des notes de séance.')
        }
      } finally {
        if (!cancelled) setNotesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const { pastRdvs, upcomingRdvs } = useMemo(() => {
    const now = new Date()
    if (!selected) {
      return { pastRdvs: [] as Reservation[], upcomingRdvs: [] as Reservation[] }
    }
    const rdvs = reservations.filter(
      (r) => r.type === 'rendez-vous' && reservationMatchesClient(r, selected),
    )
    const past = rdvs.filter((r) => r.start < now).sort((a, b) => b.start.getTime() - a.start.getTime())
    const upcoming = rdvs
      .filter((r) => r.start >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
    return { pastRdvs: past, upcomingRdvs: upcoming }
  }, [reservations, selected])

  const selectClient = (c: Client) => {
    setSelectedId(c.id)
    setDraftFicheNotes(c.notes ?? '')
  }

  const handleSaveFicheNotes = async () => {
    if (!selected) return
    try {
      setActionLoading('fiche-notes')
      await updateClient(selected.id, {
        nom: selected.nom,
        prenom: selected.prenom,
        email: selected.email,
        telephone: selected.telephone ?? '',
        notes: draftFicheNotes,
      })
      await fetchClientsAndReservations()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement des notes.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddSeanceNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || !newSeanceContent.trim()) return
    try {
      setActionLoading('seance-add')
      const d = newSeanceDate ? new Date(newSeanceDate) : null
      if (d && Number.isNaN(d.getTime())) {
        setError('Date de séance invalide.')
        return
      }
      await addSeanceNote({
        clientId: selectedId,
        content: newSeanceContent,
        seanceDate: d,
      })
      setNewSeanceContent('')
      setNewSeanceDate('')
      setSeanceNotes(await loadSeanceNotes(selectedId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'ajouter la note.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmDeleteNote = async () => {
    if (!confirmDeleteNoteId || !selectedId) return
    try {
      setActionLoading(confirmDeleteNoteId)
      await deleteSeanceNote(confirmDeleteNoteId)
      setSeanceNotes(await loadSeanceNotes(selectedId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression.')
    } finally {
      setActionLoading(null)
      setConfirmDeleteNoteId(null)
    }
  }

  const handleConfirmDeleteClient = async () => {
    if (!confirmDeleteClientId) return
    try {
      setActionLoading(confirmDeleteClientId)
      await deleteClient(confirmDeleteClientId)
      if (selectedId === confirmDeleteClientId) {
        setSelectedId(null)
        setDraftFicheNotes('')
        setSeanceNotes([])
      }
      await fetchClientsAndReservations()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression du client.')
    } finally {
      setActionLoading(null)
      setConfirmDeleteClientId(null)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-tab-content">
        <div className="dashboard-card">
          <div className="clients-loading">Chargement des clients…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-tab-content clients-tab">
      <div className="dashboard-card clients-card">
        <header className="clients-header">
          <h2>Clients</h2>
          <p className="clients-intro">
            Fiches clients : contact, notes privées, suivi des séances. Les prestations affichées reprennent
            les rendez-vous du calendrier lorsque l’e-mail ou le portable correspond.
          </p>
        </header>

        {error && (
          <div className="clients-error">
            {error}
            <button type="button" onClick={() => setError(null)} aria-label="Fermer">
              ×
            </button>
          </div>
        )}

        <div className="clients-toolbar">
          <button type="button" className="clients-btn-add" onClick={() => setShowAddModal(true)}>
            + Ajouter un client
          </button>
        </div>

        <div className="clients-layout">
          <div className="clients-list-panel">
            {clients.length === 0 ? (
              <p className="dashboard-empty">Aucun client. Créez une fiche pour commencer le suivi.</p>
            ) : (
              <ul className="clients-list">
                {clients.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`clients-list-item${selectedId === c.id ? ' clients-list-item--active' : ''}`}
                      onClick={() => selectClient(c)}
                    >
                      <span className="clients-list-name">
                        {[c.prenom, c.nom].filter(Boolean).join(' ') || 'Sans nom'}
                      </span>
                      {(c.email || c.telephone) && (
                        <span className="clients-list-contact">
                          {c.email || c.telephone}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="clients-detail-panel">
            {!selected ? (
              <p className="clients-detail-placeholder">Sélectionnez un client dans la liste ou ajoutez-en un.</p>
            ) : (
              <>
                <div className="clients-detail-head">
                  <div>
                    <h3 className="clients-detail-title">
                      {[selected.prenom, selected.nom].filter(Boolean).join(' ') || 'Sans nom'}
                    </h3>
                    <div className="clients-detail-contact">
                      {selected.email && (
                        <a href={`mailto:${selected.email}`} className="clients-contact-link">
                          {selected.email}
                        </a>
                      )}
                      {selected.telephone && (
                        <a href={`tel:${selected.telephone}`} className="clients-contact-link">
                          {selected.telephone}
                        </a>
                      )}
                      {!selected.email && !selected.telephone && (
                        <span className="clients-contact-missing">Pas de contact renseigné</span>
                      )}
                    </div>
                  </div>
                  <div className="clients-detail-actions">
                    <button
                      type="button"
                      className="clients-btn-edit"
                      onClick={() => setEditingClient(selected)}
                      disabled={!!actionLoading}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="clients-btn-delete"
                      onClick={() => setConfirmDeleteClientId(selected.id)}
                      disabled={!!actionLoading}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {!selected.email && !selected.telephone && (
                  <p className="clients-rdv-hint">
                    Ajoutez un e-mail ou un portable pour lier automatiquement les rendez-vous du calendrier.
                  </p>
                )}

                <section className="clients-section">
                  <h4 className="clients-section-title">Notes privées (fiche)</h4>
                  <textarea
                    className="clients-notes-textarea"
                    value={draftFicheNotes}
                    onChange={(e) => setDraftFicheNotes(e.target.value)}
                    rows={4}
                    placeholder="Rappels généraux, préférences, informations utiles…"
                  />
                  <button
                    type="button"
                    className="clients-btn-save-notes"
                    onClick={handleSaveFicheNotes}
                    disabled={actionLoading === 'fiche-notes'}
                  >
                    {actionLoading === 'fiche-notes' ? 'Enregistrement…' : 'Enregistrer les notes'}
                  </button>
                </section>

                <section className="clients-section clients-section--rdv">
                  <h4 className="clients-section-title">Prestations à venir</h4>
                  {upcomingRdvs.length === 0 ? (
                    <p className="clients-muted">Aucun rendez-vous à venir associé.</p>
                  ) : (
                    <ul className="clients-rdv-list">
                      {upcomingRdvs.map((r) => (
                        <li key={r.id} className="clients-rdv-item">
                          <span className="clients-rdv-date">{formatRdvDate(r.start)}</span>
                          <span className="clients-rdv-prestation">{r.prestation ?? '—'}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h4 className="clients-section-title clients-section-subtitle">Prestations passées</h4>
                  {pastRdvs.length === 0 ? (
                    <p className="clients-muted">Aucun rendez-vous passé associé.</p>
                  ) : (
                    <ul className="clients-rdv-list">
                      {pastRdvs.map((r) => (
                        <li key={r.id} className="clients-rdv-item">
                          <span className="clients-rdv-date">{formatRdvDate(r.start)}</span>
                          <span className="clients-rdv-prestation">{r.prestation ?? '—'}</span>
                          {r.resume && (
                            <span className="clients-rdv-resume">{r.resume}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="clients-section">
                  <h4 className="clients-section-title">Notes après séance</h4>
                  {notesLoading ? (
                    <p className="clients-muted">Chargement des notes…</p>
                  ) : seanceNotes.length === 0 ? (
                    <p className="clients-muted">Aucune note de séance pour l’instant.</p>
                  ) : (
                    <ul className="clients-seance-list">
                      {seanceNotes.map((n) => {
                        const seanceWhen = formatNoteDate(n.seance_date)
                        const addedWhen = formatNoteDate(n.created_at)
                        return (
                        <li key={n.id} className="clients-seance-item">
                          <div className="clients-seance-meta">
                            {seanceWhen && (
                              <span className="clients-seance-date">Séance : {seanceWhen}</span>
                            )}
                            <span className="clients-seance-created">
                              {addedWhen ? `Ajoutée le ${addedWhen}` : 'Note enregistrée'}
                            </span>
                            <button
                              type="button"
                              className="clients-seance-delete"
                              onClick={() => setConfirmDeleteNoteId(n.id)}
                              disabled={!!actionLoading}
                              aria-label="Supprimer cette note"
                            >
                              Supprimer
                            </button>
                          </div>
                          <p className="clients-seance-content">{n.content}</p>
                        </li>
                        )
                      })}
                    </ul>
                  )}

                  <form className="clients-seance-form" onSubmit={handleAddSeanceNote}>
                    <label htmlFor="clients-seance-text" className="clients-label">
                      Comment s’est passée la séance ?
                    </label>
                    <textarea
                      id="clients-seance-text"
                      className="clients-notes-textarea"
                      value={newSeanceContent}
                      onChange={(e) => setNewSeanceContent(e.target.value)}
                      rows={3}
                      placeholder="Impressions, points à suivre, ressenti…"
                    />
                    <label htmlFor="clients-seance-when" className="clients-label clients-label--optional">
                      Date de la séance (facultatif)
                    </label>
                    <input
                      id="clients-seance-when"
                      type="datetime-local"
                      className="clients-datetime-input"
                      value={newSeanceDate}
                      onChange={(e) => setNewSeanceDate(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="clients-btn-add-note"
                      disabled={!newSeanceContent.trim() || actionLoading === 'seance-add'}
                    >
                      {actionLoading === 'seance-add' ? 'Ajout…' : 'Ajouter la note'}
                    </button>
                  </form>
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      <ClientFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (data) => {
          const created = await addClient({ ...data, notes: '' })
          await fetchClientsAndReservations()
          selectClient(created)
        }}
      />

      <ClientFormModal
        isOpen={!!editingClient}
        client={editingClient ?? undefined}
        onClose={() => setEditingClient(null)}
        onSubmit={async (data) => {
          if (!editingClient) return
          await updateClient(editingClient.id, {
            ...data,
            notes: editingClient.notes ?? '',
          })
          await fetchClientsAndReservations()
        }}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteClientId}
        onClose={() => setConfirmDeleteClientId(null)}
        onConfirm={handleConfirmDeleteClient}
        title="Supprimer le client"
        message="Supprimer cette fiche et toutes les notes de séance associées ? Cette action est définitive."
        confirmLabel="Supprimer"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!confirmDeleteNoteId}
        onClose={() => setConfirmDeleteNoteId(null)}
        onConfirm={handleConfirmDeleteNote}
        title="Supprimer la note"
        message="Supprimer cette note de séance ?"
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  )
}
