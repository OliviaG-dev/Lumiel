import { useState, useCallback, useEffect, useMemo, type CSSProperties } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, setHours, setMinutes, isSameDay, addMinutes, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Event, DateHeaderProps } from 'react-big-calendar'
import type { Reservation } from '@/types/reservation'
import {
  loadReservations,
  addDisponibilite,
  addRendezVous,
  updateRendezVous,
  deleteReservation,
} from '@/lib/reservations'
import CalendrierDisponibilitesModal from './CalendrierDisponibilitesModal'
import { loadPrestations } from '@/lib/prestations'
import {
  rdvEventStylesFromCouleur,
  DEFAULT_PRESTATION_COLOR,
  prestationModalItemStyles,
} from '@/lib/prestationColors'
import type { Prestation } from '@/types/prestation'
import ReservationForm, {
  getDefaultFormData,
  getFormDataFromReservation,
  type ReservationFormData,
} from '@/components/booking/ReservationForm'
import ConfirmModal from '@/components/confirm/ConfirmModal'
import CalendrierToolbar from './CalendrierToolbar'
import CalendrierEvent from './CalendrierEvent'
import CalendrierDispoIcon from './CalendrierDispoIcon'
import { Button } from '@/components/button/Button'

/** Bandeau RDV vue mois : même hauteur que les inline-row. RBC met une height inline (slot plein) si on ne la remplace pas. */
const MONTH_VIEW_RDV_ROW_STYLE: CSSProperties = {
  height: '1.32rem',
  minHeight: '1.32rem',
  maxHeight: '1.32rem',
  padding: '1px 3px',
  boxSizing: 'border-box',
}
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CalendrierTab.css'

const locales = { 'fr': fr }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay: (date: Date) => date.getDay(),
  locales,
})

const PRESTATIONS_FALLBACK = ['Massage bien-être', 'Reiki', 'Soin énergétique', 'Consultation', 'Autre']

type CalendrierDayKind = 'past' | 'today' | 'future'

function getCalendrierDayKind(date: Date): CalendrierDayKind {
  const today = startOfDay(new Date())
  if (isSameDay(date, new Date())) return 'today'
  if (startOfDay(date) < today) return 'past'
  return 'future'
}

function CalendrierDateHeaderView({
  date,
  label,
  drilldownView,
  onDrillDown,
  hasDisponibilite = false,
  onOpenDay,
}: DateHeaderProps & { hasDisponibilite?: boolean; onOpenDay?: (d: Date) => void }) {
  const kind = getCalendrierDayKind(date)
  const content = !drilldownView ? (
    <span>{label}</span>
  ) : (
    <button
      type="button"
      className="rbc-button-link"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (onOpenDay) {
          onOpenDay(startOfDay(date))
        } else {
          onDrillDown()
        }
      }}
    >
      {label}
    </button>
  )
  return (
    <div
      className="calendrier-date-header-row"
      data-has-dispo={hasDisponibilite ? 'true' : 'false'}
    >
      {hasDisponibilite && (
        <span className="calendrier-date-dispo-marker" title="Disponibilité" aria-label="Disponibilité">
          <CalendrierDispoIcon className="calendrier-date-dispo-icon" />
        </span>
      )}
      <span className={`calendrier-date-label calendrier-date-label--${kind}`}>
        {content}
      </span>
    </div>
  )
}

function reservationToEvent(r: Reservation) {
  if (r.type === 'rendez-vous') {
    const timeStr = format(r.start, 'HH:mm', { locale: fr })
    const name = (r.prenom || r.nom)
      ? `${r.prenom ?? ''} ${r.nom ?? ''}`.trim()
      : 'Rendez-vous'
    return { ...r, title: `${timeStr} – ${name}` }
  }
  return { ...r, title: 'Disponible' }
}

interface DayModalProps {
  selectedDate: Date
  reservations: Reservation[]
  prestations: string[]
  prestationCouleurByNom: Map<string, string>
  onClose: () => void
  onAddDisponibilite: (prestation: string, start: Date, end: Date) => void | Promise<void>
  onAddRendezVous: (r: Reservation) => void
  onUpdateRendezVous: (r: Reservation) => void
  onDelete: (id: string, type: 'disponibilité' | 'rendez-vous') => void
}

function DayModal({
  selectedDate,
  reservations,
  prestations,
  prestationCouleurByNom,
  onClose,
  onAddDisponibilite,
  onAddRendezVous,
  onUpdateRendezVous,
  onDelete,
}: DayModalProps) {
  const prestationNames = prestations.length ? prestations : PRESTATIONS_FALLBACK
  const [showDispoForm, setShowDispoForm] = useState(false)
  const [showRdvForm, setShowRdvForm] = useState(false)
  const [editingRdv, setEditingRdv] = useState<Reservation | null>(null)
  const [rdvSlot, setRdvSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [formData, setFormData] = useState<ReservationFormData>(getDefaultFormData(prestationNames))
  const [dispoSlots, setDispoSlots] = useState<{ start: string; end: string }[]>([
    { start: '09:00', end: '18:00' },
  ])
  const [dispoFormError, setDispoFormError] = useState<string | null>(null)

  const canAddDisponibilite = getCalendrierDayKind(selectedDate) !== 'past'
  /** Pas de formulaire dispo sur un jour passé (évite setState dans un effect) */
  const showDispoFormUi = showDispoForm && canAddDisponibilite

  const items = reservations
    .filter((r) => isSameDay(r.start, selectedDate))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const handleDispoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDispoFormError(null)
    if (!canAddDisponibilite) {
      setDispoFormError('Impossible d’ajouter une disponibilité sur un jour passé.')
      return
    }
    const DISPO_PRESTATION = 'Toute prestation'
    const toAdd: { start: Date; end: Date }[] = []
    for (const slot of dispoSlots) {
      const [hD, mD] = slot.start.split(':').map(Number)
      const [hF, mF] = slot.end.split(':').map(Number)
      if ([hD, mD, hF, mF].some((n) => Number.isNaN(n))) continue
      const start = setMinutes(setHours(selectedDate, hD), mD)
      const end = setMinutes(setHours(selectedDate, hF), mF)
      if (end > start) toAdd.push({ start, end })
    }
    if (toAdd.length === 0) {
      setDispoFormError('Indiquez au moins une plage valide : l’heure de fin doit être après le début.')
      return
    }
    for (const { start, end } of toAdd) {
      await Promise.resolve(onAddDisponibilite(DISPO_PRESTATION, start, end))
    }
    setShowDispoForm(false)
    onClose()
  }

  const handleRdvSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const slot = rdvSlot || { start: setMinutes(setHours(selectedDate, 9), 0), end: setMinutes(setHours(selectedDate, 10), 0) }
    const end = addMinutes(slot.start, formData.duree)
    const r: Reservation = {
      id: editingRdv?.id ?? crypto.randomUUID(),
      type: 'rendez-vous',
      start: slot.start,
      end,
      prestation: formData.prestation,
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      telephone: formData.telephone,
      duree: formData.duree,
      resume: formData.resume,
    }
    if (editingRdv) {
      onUpdateRendezVous(r)
    } else {
      onAddRendezVous(r)
    }
    setShowRdvForm(false)
    setEditingRdv(null)
    setRdvSlot(null)
    setFormData(getDefaultFormData(prestationNames))
    onClose()
  }

  const startEdit = (r: Reservation) => {
    setEditingRdv(r)
    setRdvSlot({ start: r.start, end: r.end })
    setFormData(getFormDataFromReservation(r, prestationNames))
    setShowRdvForm(true)
  }

  const startAddRdv = () => {
    setEditingRdv(null)
    setRdvSlot(null)
    setFormData(getDefaultFormData(prestationNames))
    setShowRdvForm(true)
  }

  return (
    <div className="calendrier-modal-overlay" onClick={onClose}>
      <div className="calendrier-modal calendrier-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="calendrier-modal-header">
          <h3>{format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}</h3>
          <button type="button" className="calendrier-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="calendrier-modal-body">
          <section className="calendrier-modal-section">
            <h4>Événements du jour</h4>
            {items.length === 0 ? (
              <p className="calendrier-modal-empty">Aucun événement ce jour-là.</p>
            ) : (
              <div className="calendrier-modal-list">
                {items.map((r) => (
                  <div
                    key={r.id}
                    className="calendrier-modal-item"
                    style={
                      r.type === 'rendez-vous'
                        ? prestationModalItemStyles(
                            r.prestation?.trim()
                              ? prestationCouleurByNom.get(r.prestation.trim())
                              : undefined,
                          )
                        : undefined
                    }
                  >
                    <div className="calendrier-modal-item-main">
                      <span className="calendrier-modal-time">
                        {format(r.start, 'HH:mm', { locale: fr })} – {format(r.end, 'HH:mm', { locale: fr })}
                        {r.type === 'rendez-vous' && r.duree && (
                          <span className="calendrier-modal-duree">({r.duree} min)</span>
                        )}
                      </span>
                      <span className="calendrier-modal-type">
                        {r.type === 'disponibilité' ? 'Disponible' : `${r.prenom ?? ''} ${r.nom ?? ''}`.trim() || 'Rendez-vous'}
                      </span>
                    </div>
                    {r.type === 'rendez-vous' && (
                      <div className="calendrier-modal-item-details">
                        <p>{r.email}</p>
                        {r.telephone && <p>{r.telephone}</p>}
                        {r.prestation && <p>Prestation : {r.prestation}</p>}
                        {r.resume && <p className="calendrier-modal-resume">Résumé : {r.resume}</p>}
                        <div className="calendrier-modal-item-actions">
                          <Button type="button" variant="secondary" size="sm" className="btn-calendrier-edit" onClick={() => startEdit(r)}>Modifier</Button>
                          <Button type="button" variant="danger" size="sm" className="btn-calendrier-delete" onClick={() => onDelete(r.id, r.type)}>Supprimer</Button>
                        </div>
                      </div>
                    )}
                    {r.type === 'disponibilité' && (
                      <div className="calendrier-modal-item-actions calendrier-modal-item-actions--right">
                        <Button type="button" variant="danger" size="sm" className="btn-calendrier-delete" onClick={() => onDelete(r.id, r.type)}>Supprimer</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {!showDispoForm && !showRdvForm && (
            <div className="calendrier-modal-buttons">
              {canAddDisponibilite ? (
                <Button
                  type="button"
                  variant="secondary"
                  block
                  className="btn-calendrier-add"
                  onClick={() => {
                    setDispoSlots([{ start: '09:00', end: '18:00' }])
                    setDispoFormError(null)
                    setShowDispoForm(true)
                  }}
                >
                  + Ajouter une disponibilité
                </Button>
              ) : (
                <p className="calendrier-modal-past-hint" role="status">
                  Les disponibilités ne peuvent pas être ajoutées sur un jour passé.
                </p>
              )}
              <Button type="button" variant="secondary" block className="btn-calendrier-add btn-calendrier-add--rdv" onClick={startAddRdv}>
                + Ajouter un rendez-vous
              </Button>
            </div>
          )}

          {showDispoFormUi && (
            <form className="calendrier-modal-form" onSubmit={(e) => void handleDispoSubmit(e)}>
              <h4>Nouvelle disponibilité</h4>
              <p className="calendrier-dispo-form-hint">Une ou plusieurs plages pour ce jour (ex. matin et après-midi).</p>
              {dispoFormError && <p className="calendrier-dispo-form-error">{dispoFormError}</p>}
              <div className="calendrier-dispo-slots">
                {dispoSlots.map((slot, index) => (
                  <div key={index} className="calendrier-dispo-slot-block">
                    <div className="calendrier-form-row calendrier-form-grid-2">
                      <div>
                        <label htmlFor={`dispo-start-${index}`}>Début</label>
                        <input
                          id={`dispo-start-${index}`}
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const next = [...dispoSlots]
                            next[index] = { ...next[index], start: e.target.value }
                            setDispoSlots(next)
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor={`dispo-end-${index}`}>Fin</label>
                        <input
                          id={`dispo-end-${index}`}
                          type="time"
                          value={slot.end}
                          onChange={(e) => {
                            const next = [...dispoSlots]
                            next[index] = { ...next[index], end: e.target.value }
                            setDispoSlots(next)
                          }}
                          required
                        />
                      </div>
                    </div>
                    {dispoSlots.length > 1 && (
                      <button
                        type="button"
                        className="calendrier-dispo-slot-remove-inline"
                        onClick={() => setDispoSlots(dispoSlots.filter((_, i) => i !== index))}
                        aria-label="Retirer cette plage"
                      >
                        × Retirer la plage
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="calendrier-dispo-add-slot-inline"
                  onClick={() => setDispoSlots([...dispoSlots, { start: '14:00', end: '18:00' }])}
                >
                  + Plage horaire
                </button>
              </div>
              <div className="calendrier-form-actions">
                <Button
                  type="button"
                  variant="outline"
                  grow
                  onClick={() => {
                    setDispoFormError(null)
                    setShowDispoForm(false)
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" grow>
                  Ajouter
                </Button>
              </div>
            </form>
          )}

          {showRdvForm && (
            <form className="calendrier-modal-form" onSubmit={handleRdvSubmit}>
              <h4>{editingRdv ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h4>
              {!editingRdv && (
                <div className="calendrier-form-row">
                  <label>Heure de début</label>
                  <input
                    type="time"
                    value={rdvSlot ? format(rdvSlot.start, 'HH:mm') : '09:00'}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number)
                      const start = setMinutes(setHours(selectedDate, h), m)
                      setRdvSlot({ start, end: addMinutes(start, formData.duree) })
                    }}
                    required
                  />
                </div>
              )}
              <ReservationForm
                data={formData}
                onChange={setFormData}
                submitLabel={editingRdv ? 'Enregistrer' : 'Ajouter'}
                onCancel={() => {
                  setShowRdvForm(false)
                  setEditingRdv(null)
                }}
                prestations={prestationNames}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CalendrierTab() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [prestationsRows, setPrestationsRows] = useState<Prestation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState(new Date())
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [dispoModalOpen, setDispoModalOpen] = useState(false)

  const refreshReservations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await loadReservations()
      setReservations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshReservations()
    loadPrestations().then(setPrestationsRows)
  }, [refreshReservations])

  const reloadReservationsAfterDispo = useCallback(async () => {
    try {
      const data = await loadReservations()
      setReservations(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }, [])

  const prestations = useMemo(
    () => (prestationsRows.length ? prestationsRows.map((x) => x.nom) : []),
    [prestationsRows],
  )

  const prestationCouleurByNom = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of prestationsRows) {
      m.set(p.nom.trim(), p.couleur)
    }
    return m
  }, [prestationsRows])

  /** Nombre de RDV par jour (clé yyyy-MM-dd) — pour pastilles carrées si > 2 */
  const rdvCountByDayKey = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of reservations) {
      if (r.type !== 'rendez-vous') continue
      const key = format(startOfDay(r.start), 'yyyy-MM-dd')
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return m
  }, [reservations])

  /** Ordre du RDV dans la journée (0..n-1), pour les aligner côte à côte */
  const rdvIndexById = useMemo(() => {
    const m = new Map<string, number>()
    const byDay = new Map<string, Reservation[]>()
    for (const r of reservations) {
      if (r.type !== 'rendez-vous') continue
      const key = format(startOfDay(r.start), 'yyyy-MM-dd')
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(r)
    }
    for (const arr of byDay.values()) {
      arr.sort((a, b) => a.start.getTime() - b.start.getTime())
      arr.forEach((res, i) => m.set(res.id, i))
    }
    return m
  }, [reservations])

  const monthDateHeader = useMemo(
    () =>
      function MonthDateHeader(props: DateHeaderProps) {
        const hasDisponibilite = reservations.some(
          (r) => r.type === 'disponibilité' && isSameDay(r.start, props.date),
        )
        return (
          <CalendrierDateHeaderView
            {...props}
            hasDisponibilite={hasDisponibilite}
            onOpenDay={setModalDate}
          />
        )
      },
    [reservations],
  )

  const handleShowMore = useCallback((_events: Reservation[], day: Date) => {
    setModalDate(startOfDay(day))
  }, [])

  const handleSelectSlot = useCallback(({ start }: { start: Date; end: Date }) => {
    setModalDate(start)
  }, [])

  const handleAddDisponibilite = useCallback(
    async (prestation: string, start: Date, end: Date) => {
      try {
        await addDisponibilite({ start, end, prestation })
        await refreshReservations()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    },
    [refreshReservations]
  )

  const handleAddRendezVous = useCallback(
    async (r: Reservation) => {
      try {
        await addRendezVous(r)
        await refreshReservations()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    },
    [refreshReservations]
  )

  const handleUpdateRendezVous = useCallback(
    async (r: Reservation) => {
      try {
        await updateRendezVous(r)
        await refreshReservations()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    },
    [refreshReservations]
  )

  const [pendingDelete, setPendingDelete] = useState<{
    id: string
    type: 'disponibilité' | 'rendez-vous'
  } | null>(null)

  const handleDeleteClick = useCallback((id: string, type: 'disponibilité' | 'rendez-vous') => {
    setPendingDelete({ id, type })
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return
    try {
      await deleteReservation(pendingDelete.id, pendingDelete.type)
      await refreshReservations()
      setModalDate(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setPendingDelete(null)
    }
  }, [pendingDelete, refreshReservations])

  /** Uniquement les RDV : les dispos sont masquées en mois mais comptaient encore pour « + N » (bug +2 avec 1 RDV + 1 dispo). */
  const calendarEvents = useMemo(
    () => reservations.filter((r) => r.type === 'rendez-vous').map(reservationToEvent),
    [reservations],
  )
  const reservationsForDay = modalDate ? reservations.filter((r) => isSameDay(r.start, modalDate)) : []

  const handleSelectEvent = useCallback((event: Event) => {
    const r = event as Reservation
    setModalDate(r.start)
  }, [])

  const handleNavigate = useCallback((newDate: Date) => setDate(newDate), [])

  const messages = useMemo(
    () => ({
      today: "Aujourd'hui",
      previous: 'Précédent',
      next: 'Suivant',
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      agenda: 'Agenda',
      date: 'Date',
      time: 'Heure',
      event: 'Événement',
      noEventsInRange: 'Aucun rendez-vous sur cette période.',
      showMore: (total: number) => `+ ${total} rendez-vous`,
    }),
    [],
  )

  if (loading) {
    return (
      <div className="dashboard-tab-content calendrier-tab">
        <div className="dashboard-card calendrier-card">
          <div className="calendrier-loading">Chargement du calendrier...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-tab-content calendrier-tab">
      <div className="dashboard-card calendrier-card">
        {error && (
          <div className="calendrier-error">
            {error}
            <button type="button" onClick={() => setError(null)}>×</button>
          </div>
        )}
        <header className="dashboard-page-header calendrier-page-header">
          <span className="dashboard-page-header-accent" aria-hidden="true" />
          <div className="dashboard-page-header-text">
            <h2 className="dashboard-page-title">Calendrier</h2>
            <p className="dashboard-page-tagline">Rendez-vous et disponibilités</p>
          </div>
        </header>
        <div className="calendrier-disponibilites-bar">
          <Button
            type="button"
            variant="primary"
            className="calendrier-btn-disponibilites"
            onClick={() => setDispoModalOpen(true)}
          >
            Gestion des disponibilités
          </Button>
        </div>
        <CalendrierDisponibilitesModal
          isOpen={dispoModalOpen}
          onClose={() => setDispoModalOpen(false)}
          calendarMonth={date}
          reservations={reservations}
          onApplied={reloadReservationsAfterDispo}
        />
        {modalDate && (
          <DayModal
            selectedDate={modalDate}
            reservations={reservationsForDay}
            prestations={prestations}
            prestationCouleurByNom={prestationCouleurByNom}
            onClose={() => setModalDate(null)}
            onAddDisponibilite={handleAddDisponibilite}
            onAddRendezVous={handleAddRendezVous}
            onUpdateRendezVous={handleUpdateRendezVous}
            onDelete={handleDeleteClick}
          />
        )}
        {pendingDelete && (
          <ConfirmModal
            isOpen
            onClose={() => setPendingDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Supprimer l'événement"
            message="Supprimer cet événement ?"
            confirmLabel="Supprimer"
            variant="danger"
          />
        )}
        <div className="calendrier-wrapper">
          <Calendar<Reservation>
            localizer={localizer}
            culture="fr"
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            views={['month']}
            view="month"
            date={date}
            onNavigate={handleNavigate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onShowMore={handleShowMore}
            doShowMoreDrillDown={false}
            showAllEvents
            selectable
            messages={messages}
            dayPropGetter={(d) => {
              const kind = getCalendrierDayKind(d)
              const hasDispo = reservations.some(
                (r) => r.type === 'disponibilité' && isSameDay(r.start, d),
              )
              const classes = [`calendrier-day-bg--${kind}`]
              if (hasDispo) classes.push('calendrier-day-bg--has-dispo')
              return { className: classes.join(' ') }
            }}
            components={{
              toolbar: CalendrierToolbar,
              month: {
                dateHeader: monthDateHeader,
                event: CalendrierEvent,
              },
            }}
            eventPropGetter={(event) => {
              const r = event as Reservation
              if (r.type === 'disponibilité') {
                return {
                  className: 'rbc-event--disponibilite',
                  style: { width: 'fit-content', maxWidth: '100%' },
                }
              }
              const nom = r.prestation?.trim()
              const hex = nom ? prestationCouleurByNom.get(nom) : undefined
              const dayKey = format(startOfDay(r.start), 'yyyy-MM-dd')
              const rdvCeJour = rdvCountByDayKey.get(dayKey) ?? 0
              const baseStyle = rdvEventStylesFromCouleur(hex ?? DEFAULT_PRESTATION_COLOR)
              /* Plus de 2 RDV : rectangles côte à côte (grille 7 jours, calque scroll) */
              if (rdvCeJour > 2) {
                const idx = rdvIndexById.get(r.id) ?? 0
                const total = rdvCeJour
                const col = (r.start.getDay() + 6) % 7
                const inlineStyle: CSSProperties = {
                  ...baseStyle,
                  ...MONTH_VIEW_RDV_ROW_STYLE,
                  position: 'absolute',
                  left: `calc(${col} * (100% / 7) + (100% / 7) * ${idx} / ${total})`,
                  width: `calc((100% / 7) / ${total} - 2px)`,
                  maxWidth: `calc((100% / 7) / ${total} - 2px)`,
                  top: '0rem',
                  margin: 0,
                  zIndex: 4,
                }
                return {
                  className: 'rbc-event--rendezvous rbc-event--prestation-couleur calendrier-rdv--inline-row',
                  style: inlineStyle,
                }
              }
              return {
                className: 'rbc-event--rendezvous rbc-event--prestation-couleur',
                style: { ...baseStyle, ...MONTH_VIEW_RDV_ROW_STYLE },
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
