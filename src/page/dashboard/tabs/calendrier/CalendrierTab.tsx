import { useState, useCallback, useEffect, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import {
  format,
  parse,
  startOfWeek,
  setHours,
  setMinutes,
  isSameDay,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  addMinutes,
  startOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Event, DateHeaderProps } from 'react-big-calendar'
import type { Reservation } from '../../../../types/reservation'
import {
  loadReservations,
  addDisponibilite,
  addRendezVous,
  updateRendezVous,
  deleteReservation,
  addDisponibilitesBatch,
} from '../../../../lib/reservations'
import { loadPrestations } from '../../../../lib/prestations'
import { rdvEventStylesFromCouleur, DEFAULT_PRESTATION_COLOR } from '../../../../lib/prestationColors'
import type { Prestation } from '../../../../types/prestation'
import ReservationForm, {
  getDefaultFormData,
  getFormDataFromReservation,
  type ReservationFormData,
} from '../../../../components/booking/ReservationForm'
import ConfirmModal from '../../../../components/confirm/ConfirmModal'
import CalendrierToolbar from './CalendrierToolbar'
import CalendrierEvent from './CalendrierEvent'
import CalendrierDispoIcon from './CalendrierDispoIcon'
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
}: DateHeaderProps & { hasDisponibilite?: boolean }) {
  const kind = getCalendrierDayKind(date)
  const content = !drilldownView ? (
    <span>{label}</span>
  ) : (
    <button type="button" className="rbc-button-link" onClick={onDrillDown}>
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

const WEEKDAYS = [
  { day: 1, label: 'Lun' },
  { day: 2, label: 'Mar' },
  { day: 3, label: 'Mer' },
  { day: 4, label: 'Jeu' },
  { day: 5, label: 'Ven' },
  { day: 6, label: 'Sam' },
  { day: 0, label: 'Dim' },
] as const

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
  onClose: () => void
  onAddDisponibilite: (prestation: string, start: Date, end: Date) => void
  onAddRendezVous: (r: Reservation) => void
  onUpdateRendezVous: (r: Reservation) => void
  onDelete: (id: string, type: 'disponibilité' | 'rendez-vous') => void
}

function DayModal({
  selectedDate,
  reservations,
  prestations,
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
  const [prestation, setPrestation] = useState(prestationNames[0])
  const [heureDebut, setHeureDebut] = useState('09:00')
  const [heureFin, setHeureFin] = useState('10:00')

  const items = reservations
    .filter((r) => isSameDay(r.start, selectedDate))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const handleDispoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const [hD, mD] = heureDebut.split(':').map(Number)
    const [hF, mF] = heureFin.split(':').map(Number)
    const start = setMinutes(setHours(selectedDate, hD), mD)
    const end = setMinutes(setHours(selectedDate, hF), mF)
    if (end > start) {
      onAddDisponibilite(prestation, start, end)
      setShowDispoForm(false)
      onClose()
    }
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
                  <div key={r.id} className="calendrier-modal-item">
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
                          <button type="button" className="btn-calendrier-edit" onClick={() => startEdit(r)}>Modifier</button>
                          <button type="button" className="btn-calendrier-delete" onClick={() => onDelete(r.id, r.type)}>Supprimer</button>
                        </div>
                      </div>
                    )}
                    {r.type === 'disponibilité' && (
                      <div className="calendrier-modal-item-actions calendrier-modal-item-actions--right">
                        <button type="button" className="btn-calendrier-delete" onClick={() => onDelete(r.id, r.type)}>Supprimer</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {!showDispoForm && !showRdvForm && (
            <div className="calendrier-modal-buttons">
              <button type="button" className="btn-calendrier-add" onClick={() => setShowDispoForm(true)}>
                + Ajouter une disponibilité
              </button>
              <button type="button" className="btn-calendrier-add btn-calendrier-add--rdv" onClick={startAddRdv}>
                + Ajouter un rendez-vous
              </button>
            </div>
          )}

          {showDispoForm && (
            <form className="calendrier-modal-form" onSubmit={handleDispoSubmit}>
              <h4>Nouvelle disponibilité</h4>
              <div className="calendrier-form-row">
                <label>Prestation</label>
                <select value={prestation} onChange={(e) => setPrestation(e.target.value)} required>
                  {prestationNames.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="calendrier-form-row calendrier-form-grid-2">
                <div>
                  <label>Heure de début</label>
                  <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} required />
                </div>
                <div>
                  <label>Heure de fin</label>
                  <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} required />
                </div>
              </div>
              <div className="calendrier-form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDispoForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Ajouter</button>
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
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]))
  const [heureOuverture, setHeureOuverture] = useState('09:00')
  const [heureFermeture, setHeureFermeture] = useState('18:00')

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

  const toggleDay = useCallback((day: number) => {
    setOpenDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }, [])

  const monthDateHeader = useMemo(
    () =>
      function MonthDateHeader(props: DateHeaderProps) {
        const hasDisponibilite = reservations.some(
          (r) => r.type === 'disponibilité' && isSameDay(r.start, props.date),
        )
        return <CalendrierDateHeaderView {...props} hasDisponibilite={hasDisponibilite} />
      },
    [reservations],
  )

  const applyToMonth = useCallback(async () => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const days = eachDayOfInterval({ start, end })
    const [hO, mO] = heureOuverture.split(':').map(Number)
    const [hF, mF] = heureFermeture.split(':').map(Number)
    const items: { start: Date; end: Date; prestation?: string }[] = []
    for (const d of days) {
      if (!openDays.has(getDay(d))) continue
      const startTime = setMinutes(setHours(d, hO), mO)
      const endTime = setMinutes(setHours(d, hF), mF)
      if (endTime <= startTime) continue
      items.push({ start: startTime, end: endTime, prestation: 'Toute prestation' })
    }
    if (items.length === 0) return
    try {
      await addDisponibilitesBatch(items)
      await refreshReservations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }, [date, openDays, heureOuverture, heureFermeture, refreshReservations])

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

  const events = reservations.map(reservationToEvent)
  const reservationsForDay = modalDate ? reservations.filter((r) => isSameDay(r.start, modalDate)) : []

  const handleSelectEvent = useCallback((event: Event) => {
    const r = event as Reservation
    setModalDate(r.start)
  }, [])

  const handleNavigate = useCallback((newDate: Date) => setDate(newDate), [])

  const messages = {
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
  }

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
        {modalDate && (
          <DayModal
            selectedDate={modalDate}
            reservations={reservationsForDay}
            prestations={prestations}
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
        <div className="calendrier-open-days">
          <div className="calendrier-open-days-row">
            <span className="calendrier-open-days-label">Jours ouverts</span>
            <div className="calendrier-open-days-toggles">
              {WEEKDAYS.map(({ day, label }) => (
                <button
                  key={day}
                  type="button"
                  className={`calendrier-day-toggle ${openDays.has(day) ? 'calendrier-day-toggle--active' : ''}`}
                  onClick={() => toggleDay(day)}
                  title={openDays.has(day) ? 'Fermé ce jour' : 'Ouvert ce jour'}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="calendrier-open-days-hours">
              <label>
                <span className="sr-only">Heure d'ouverture</span>
                <input
                  type="time"
                  value={heureOuverture}
                  onChange={(e) => setHeureOuverture(e.target.value)}
                  className="calendrier-time-input"
                />
              </label>
              <span className="calendrier-hours-sep">–</span>
              <label>
                <span className="sr-only">Heure de fermeture</span>
                <input
                  type="time"
                  value={heureFermeture}
                  onChange={(e) => setHeureFermeture(e.target.value)}
                  className="calendrier-time-input"
                />
              </label>
            </div>
            <button type="button" className="calendrier-apply-btn" onClick={applyToMonth}>
              Appliquer au mois
            </button>
          </div>
        </div>
        <div className="calendrier-wrapper">
          <Calendar
            localizer={localizer}
            culture="fr"
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={['month']}
            view="month"
            date={date}
            onNavigate={handleNavigate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            messages={messages}
            dayPropGetter={(d) => ({
              className: `calendrier-day-bg--${getCalendrierDayKind(d)}`,
            })}
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
              return {
                className: 'rbc-event--rendezvous rbc-event--prestation-couleur',
                style: rdvEventStylesFromCouleur(hex ?? DEFAULT_PRESTATION_COLOR),
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
