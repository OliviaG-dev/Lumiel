import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { addDisponibilitesBatch } from '../../../../lib/reservations'
import type { Reservation } from '../../../../types/reservation'
import { Button } from '../../../../components/button/Button'
import './CalendrierDisponibilitesModal.css'

type TimeSlot = { start: string; end: string }

type DayRow = {
  dayKey: string
  date: Date
  /** ex. « Lundi » (sans date) */
  label: string
  /** Jour sélectionné : affiche les plages horaires */
  active: boolean
  slots: TimeSlot[]
}

type WeekBlock = {
  weekKey: string
  /** ex. « 3 mars au 9 mars 2025 » */
  rangeLabel: string
  days: DayRow[]
}

function capitalizeFr(s: string) {
  return s.replace(/^\w/, (c) => c.toUpperCase())
}

/** Semaines (lundi → dimanche) qui recoupent le mois ; jours du mois uniquement, sans jours déjà passés. */
function buildWeekBlocks(month: Date): WeekBlock[] {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const today = startOfDay(new Date())
  let monday = startOfWeek(monthStart, { weekStartsOn: 1 })
  const blocks: WeekBlock[] = []

  while (monday <= monthEnd) {
    const sunday = addDays(monday, 6)
    const rawDays = eachDayOfInterval({
      start: monday > monthStart ? monday : monthStart,
      end: sunday < monthEnd ? sunday : monthEnd,
    })
    const daysInWeek = rawDays.filter((date) => !isBefore(startOfDay(date), today))

    if (daysInWeek.length === 0) {
      monday = addDays(monday, 7)
      continue
    }

    const days: DayRow[] = daysInWeek.map((date) => ({
      dayKey: format(date, 'yyyy-MM-dd'),
      date,
      label: capitalizeFr(format(date, 'EEEE', { locale: fr })),
      active: false,
      slots: [{ start: '09:00', end: '18:00' }],
    }))

    const first = days[0].date
    const last = days[days.length - 1].date
    const sameYear = first.getFullYear() === last.getFullYear()
    const rangeLabel = sameYear
      ? `${format(first, 'd MMMM', { locale: fr })} au ${format(last, 'd MMMM yyyy', { locale: fr })}`
      : `${format(first, 'd MMMM yyyy', { locale: fr })} au ${format(last, 'd MMMM yyyy', { locale: fr })}`

    blocks.push({
      weekKey: format(monday, 'yyyy-MM-dd'),
      rangeLabel: capitalizeFr(rangeLabel),
      days,
    })

    monday = addDays(monday, 7)
  }

  return blocks
}

/** Regroupe les disponibilités en base par jour (mois affiché, jours futurs ou aujourd’hui uniquement). */
function slotsByDayFromDisponibilites(
  reservations: Reservation[],
  calendarMonth: Date,
): Map<string, TimeSlot[]> {
  const map = new Map<string, TimeSlot[]>()
  const today = startOfDay(new Date())
  const y = calendarMonth.getFullYear()
  const m = calendarMonth.getMonth()

  for (const r of reservations) {
    if (r.type !== 'disponibilité') continue
    const d = startOfDay(r.start)
    if (d.getFullYear() !== y || d.getMonth() !== m) continue
    if (isBefore(d, today)) continue
    const key = format(d, 'yyyy-MM-dd')
    const slot: TimeSlot = {
      start: format(r.start, 'HH:mm'),
      end: format(r.end, 'HH:mm'),
    }
    const list = map.get(key) ?? []
    list.push(slot)
    map.set(key, list)
  }

  for (const [key, list] of map) {
    const seen = new Set<string>()
    const deduped: TimeSlot[] = []
    for (const s of list.sort((a, b) => a.start.localeCompare(b.start))) {
      const id = `${s.start}-${s.end}`
      if (seen.has(id)) continue
      seen.add(id)
      deduped.push(s)
    }
    map.set(key, deduped)
  }

  return map
}

function mergeWeeksWithExistingSlots(weeks: WeekBlock[], byDay: Map<string, TimeSlot[]>): WeekBlock[] {
  return weeks.map((w) => ({
    ...w,
    days: w.days.map((d) => {
      const ex = byDay.get(d.dayKey)
      if (!ex || ex.length === 0) return d
      return {
        ...d,
        active: true,
        slots: ex.map((s) => ({ ...s })),
      }
    }),
  }))
}

interface CalendrierDisponibilitesModalProps {
  isOpen: boolean
  onClose: () => void
  calendarMonth: Date
  /** Liste chargée (disponibilités + RDV) — seules les disponibilités sont utilisées pour le préremplissage */
  reservations: Reservation[]
  onApplied: () => void | Promise<void>
}

/** Limite de navigation vers le futur (mois) depuis le mois d’ancrage à l’ouverture du modal. */
const MAX_MONTHS_AHEAD = 48

export default function CalendrierDisponibilitesModal({
  isOpen,
  onClose,
  calendarMonth,
  reservations,
  onApplied,
}: CalendrierDisponibilitesModalProps) {
  /** Mois d’ancrage : celui du calendrier à l’ouverture ; on ne peut pas revenir avant. */
  const [anchorMonth, setAnchorMonth] = useState(() => startOfMonth(calendarMonth))
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(calendarMonth))

  useEffect(() => {
    if (!isOpen) return
    const anchor = startOfMonth(calendarMonth)
    setAnchorMonth(anchor)
    setDisplayMonth(anchor)
  }, [isOpen, calendarMonth])

  const maxNavMonth = useMemo(() => startOfMonth(addMonths(anchorMonth, MAX_MONTHS_AHEAD)), [anchorMonth])

  const templateWeeks = useMemo(() => buildWeekBlocks(displayMonth), [displayMonth])

  const slotsByDay = useMemo(
    () => slotsByDayFromDisponibilites(reservations, displayMonth),
    [reservations, displayMonth],
  )

  const [weeks, setWeeks] = useState<WeekBlock[]>([])
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  const canGoToPrevMonth = isAfter(displayMonth, anchorMonth)
  const canGoToNextMonth = isBefore(displayMonth, maxNavMonth)

  const goToPrevMonth = useCallback(() => {
    if (!canGoToPrevMonth) return
    setDisplayMonth((m) => startOfMonth(addMonths(m, -1)))
  }, [canGoToPrevMonth])

  const goToNextMonth = useCallback(() => {
    if (!canGoToNextMonth) return
    setDisplayMonth((m) => startOfMonth(addMonths(m, 1)))
  }, [canGoToNextMonth])

  useEffect(() => {
    if (!isOpen) return
    const base = templateWeeks.map((w) => structuredClone(w))
    setWeeks(mergeWeeksWithExistingSlots(base, slotsByDay))
    setError(null)
  }, [isOpen, templateWeeks, slotsByDay])

  const updateSlot = useCallback(
    (weekKey: string, dayKey: string, slotIndex: number, field: 'start' | 'end', value: string) => {
      setWeeks((prev) =>
        prev.map((w) => {
          if (w.weekKey !== weekKey) return w
          return {
            ...w,
            days: w.days.map((d) => {
              if (d.dayKey !== dayKey) return d
              const slots = d.slots.map((s, i) =>
                i === slotIndex ? { ...s, [field]: value } : s,
              )
              return { ...d, slots }
            }),
          }
        }),
      )
    },
    [],
  )

  const addSlot = useCallback((weekKey: string, dayKey: string) => {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.weekKey !== weekKey) return w
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.dayKey !== dayKey) return d
            return { ...d, slots: [...d.slots, { start: '14:00', end: '18:00' }] }
          }),
        }
      }),
    )
  }, [])

  const removeSlot = useCallback((weekKey: string, dayKey: string, slotIndex: number) => {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.weekKey !== weekKey) return w
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.dayKey !== dayKey) return d
            if (d.slots.length <= 1) return d
            return {
              ...d,
              slots: d.slots.filter((_, i) => i !== slotIndex),
            }
          }),
        }
      }),
    )
  }, [])

  const toggleDayActive = useCallback((weekKey: string, dayKey: string) => {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.weekKey !== weekKey) return w
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.dayKey !== dayKey) return d
            const next = !d.active
            if (!next) return { ...d, active: false }
            return {
              ...d,
              active: true,
              slots: d.slots.length > 0 ? d.slots : [{ start: '09:00', end: '18:00' }],
            }
          }),
        }
      }),
    )
  }, [])

  const handleApply = async () => {
    const items: { start: Date; end: Date; prestation?: string }[] = []

    for (const week of weeks) {
      for (const day of week.days) {
        if (!day.active) continue
        for (const slot of day.slots) {
          const [hS, mS] = slot.start.split(':').map(Number)
          const [hE, mE] = slot.end.split(':').map(Number)
          if ([hS, mS, hE, mE].some((n) => Number.isNaN(n))) {
            setError(`Heures invalides pour ${day.label}.`)
            return
          }
          const start = setMinutes(setHours(day.date, hS), mS)
          const end = setMinutes(setHours(day.date, hE), mE)
          if (!(end > start)) {
            setError(
              `Plage invalide (${slot.start} – ${slot.end}) pour ${day.label}. L’heure de fin doit être après le début.`,
            )
            return
          }
          items.push({ start, end, prestation: 'Toute prestation' })
        }
      }
    }

    if (items.length === 0) {
      setError('Activez au moins un jour et renseignez une plage horaire valide.')
      return
    }

    try {
      setApplying(true)
      setError(null)
      await addDisponibilitesBatch(items)
      await onApplied()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’application.')
    } finally {
      setApplying(false)
    }
  }

  if (!isOpen) return null

  const monthLabel = capitalizeFr(format(displayMonth, 'MMMM yyyy', { locale: fr }))
  const target = document.getElementById('layout-main')

  const content = (
    <div className="calendrier-dispo-modal-overlay" onClick={onClose}>
      <div
        className="calendrier-dispo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendrier-dispo-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="calendrier-dispo-modal-header">
          <h2 id="calendrier-dispo-modal-title">Gestion des disponibilités</h2>
          <button type="button" className="calendrier-dispo-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="calendrier-dispo-modal-body calendrier-dispo-modal-body--scroll">
          <div className="calendrier-dispo-modal-month">
            <div className="calendrier-dispo-month-nav" role="group" aria-label="Choisir le mois à configurer">
              <button
                type="button"
                className="calendrier-dispo-month-nav-btn"
                onClick={goToPrevMonth}
                disabled={!canGoToPrevMonth}
                aria-label="Mois précédent"
                title="Mois précédent"
              >
                ‹
              </button>
              <div className="calendrier-dispo-month-nav-center">
                <span className="calendrier-dispo-month-nav-label">Mois affiché</span>
                <h3 className="calendrier-dispo-modal-month-title" id="calendrier-dispo-month-heading">
                  {monthLabel}
                </h3>
              </div>
              <button
                type="button"
                className="calendrier-dispo-month-nav-btn"
                onClick={goToNextMonth}
                disabled={!canGoToNextMonth}
                aria-label="Mois suivant"
                title="Mois suivant"
              >
                ›
              </button>
            </div>
            <p className="calendrier-dispo-modal-intro">
              Les plages déjà enregistrées pour ce mois sont préremplies. Utilisez les flèches pour parcourir les mois
              suivants et planifier vos disponibilités à l’avance. Le retour en arrière s’arrête au mois du calendrier
              (à l’ouverture de cette fenêtre). Cliquez sur un jour pour l’activer ou le désactiver et ajuster les
              horaires (plusieurs plages possibles par jour). Les jours déjà passés ne sont pas proposés.
            </p>
          </div>
          {error && <p className="calendrier-dispo-modal-error">{error}</p>}

          {weeks.length === 0 && (
            <p className="calendrier-dispo-modal-empty">
              Aucun jour à venir dans ce mois (tous les jours sont déjà passés). Passez au mois suivant avec la flèche
              à droite, ou choisissez un mois plus récent dans le calendrier principal.
            </p>
          )}

          {weeks.map((week) => (
            <section key={week.weekKey} className="calendrier-dispo-week" aria-labelledby={`week-${week.weekKey}`}>
              <h4 id={`week-${week.weekKey}`} className="calendrier-dispo-week-range">
                Semaine du {week.rangeLabel}
              </h4>
              <div className="calendrier-dispo-week-days">
                {week.days.map((day) => (
                  <div key={day.dayKey} className="calendrier-dispo-day-block">
                    <button
                      type="button"
                      className={`calendrier-dispo-day-pill ${day.active ? 'calendrier-dispo-day-pill--active' : ''}`}
                      onClick={() => toggleDayActive(week.weekKey, day.dayKey)}
                      aria-pressed={day.active}
                    >
                      {day.label}
                    </button>
                    {day.active && (
                      <div className="calendrier-dispo-day-slots">
                        {day.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="calendrier-dispo-slot-row">
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) =>
                                updateSlot(week.weekKey, day.dayKey, slotIndex, 'start', e.target.value)
                              }
                              className="calendrier-dispo-time-input"
                              aria-label={`Début ${day.label} plage ${slotIndex + 1}`}
                            />
                            <span className="calendrier-dispo-hours-sep">–</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) =>
                                updateSlot(week.weekKey, day.dayKey, slotIndex, 'end', e.target.value)
                              }
                              className="calendrier-dispo-time-input"
                              aria-label={`Fin ${day.label} plage ${slotIndex + 1}`}
                            />
                            {day.slots.length > 1 && (
                              <button
                                type="button"
                                className="calendrier-dispo-slot-remove"
                                onClick={() => removeSlot(week.weekKey, day.dayKey, slotIndex)}
                                aria-label={`Retirer la plage ${slotIndex + 1}`}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="calendrier-dispo-add-slot"
                          onClick={() => addSlot(week.weekKey, day.dayKey)}
                        >
                          + Plage horaire
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="calendrier-dispo-modal-actions">
            <Button type="button" variant="outline" className="calendrier-dispo-btn-secondary" onClick={onClose}>
              Fermer
            </Button>
            <Button
              type="button"
              variant="primary"
              className="calendrier-dispo-btn-primary"
              onClick={() => void handleApply()}
              disabled={applying || weeks.length === 0}
            >
              {applying ? 'Application…' : 'Appliquer au mois'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return target ? createPortal(content, target) : content
}
