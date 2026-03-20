import { useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import {
  format,
  parse,
  startOfWeek,
  addMinutes,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Event } from 'react-big-calendar'
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

export interface Appointment {
  id: string
  title: string
  start: Date
  end: Date
  client?: string
  prestation?: string
}

const defaultEvents: Appointment[] = []

export default function CalendrierTab() {
  const [events, setEvents] = useState<Appointment[]>(defaultEvents)
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    const title = window.prompt('Titre du rendez-vous:', 'Rendez-vous')
    if (title) {
      const newEvent: Appointment = {
        id: crypto.randomUUID(),
        title,
        start,
        end: addMinutes(end, 30),
      }
      setEvents((prev) => [...prev, newEvent])
    }
  }, [])

  const handleSelectEvent = useCallback((event: Event) => {
    const appointment = event as Appointment
    if (window.confirm(`Supprimer "${appointment.title}" ?`)) {
      setEvents((prev) => prev.filter((e) => e.id !== appointment.id))
    }
  }, [])

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate)
  }, [])

  const handleViewChange = useCallback((newView: View) => {
    setView(newView)
  }, [])

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

  return (
    <div className="dashboard-tab-content calendrier-tab">
      <div className="dashboard-card calendrier-card">
        <h2>Calendrier</h2>
        <p className="calendrier-desc">
          Gérez vos disponibilités et rendez-vous. Cliquez sur un créneau pour ajouter un rendez-vous, sur un événement pour le supprimer.
        </p>
        <div className="calendrier-wrapper">
          <Calendar
            localizer={localizer}
            culture="fr"
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            date={date}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            messages={messages}
          />
        </div>
      </div>
    </div>
  )
}
