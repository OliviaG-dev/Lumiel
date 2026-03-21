import { useState, useCallback, useEffect } from 'react'
import { format, addMinutes } from 'date-fns'
import { fr } from 'date-fns/locale'
import { loadReservations, addRendezVous, getAvailableSlots, getDatesWithAvailability } from '../../lib/reservations'
import type { Reservation } from '../../types/reservation'
import ReservationForm, {
  defaultFormData,
  type ReservationFormData,
} from './ReservationForm'
import './BookingModal.css'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function BookingModal({ isOpen, onClose, onSuccess }: BookingModalProps) {
  const [step, setStep] = useState<'date' | 'slot' | 'form'>('date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [formData, setFormData] = useState<ReservationFormData>(defaultFormData)
  const [submitted, setSubmitted] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && !submitted) {
      loadReservations().then(setReservations)
    }
  }, [isOpen, submitted])

  const availableDates = getDatesWithAvailability(reservations, new Date(), 60)
  const slots = selectedDate ? getAvailableSlots(selectedDate, reservations) : []

  const reset = useCallback(() => {
    setStep('date')
    setSelectedDate(null)
    setSelectedSlot(null)
    setFormData(defaultFormData)
    setSubmitted(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setStep('slot')
    setSelectedSlot(null)
  }

  const handleSlotClick = (slot: { start: Date; end: Date }) => {
    setSelectedSlot(slot)
    setStep('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || !formData) return

    setLoading(true)
    setSubmitError(null)
    const slotDuration = (selectedSlot.end.getTime() - selectedSlot.start.getTime()) / 60000
    const duree = Math.min(formData.duree, slotDuration)
    const start = new Date(selectedSlot.start)
    const end = addMinutes(start, duree)

    try {
      await addRendezVous({
        start,
        end,
        prestation: formData.prestation,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        duree,
        resume: formData.resume,
      })
      setSubmitted(true)
      onSuccess?.()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la réservation')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="booking-modal-overlay" onClick={handleClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h2>Réserver une séance</h2>
          <button type="button" className="booking-modal-close" onClick={handleClose} aria-label="Fermer">
            ×
          </button>
        </div>

        <div className="booking-modal-body">
          {submitted ? (
            <div className="booking-success">
              <p className="booking-success-title">Réservation enregistrée</p>
              <p>
                Merci ! Votre demande a bien été envoyée. Le praticien vous recontactera pour confirmer le rendez-vous.
              </p>
              <button type="button" className="btn-booking-primary" onClick={handleClose}>
                Fermer
              </button>
            </div>
          ) : (
            <>
              <div className="booking-steps">
                <span className={step === 'date' ? 'active' : ''}>1. Date</span>
                <span className={step === 'slot' ? 'active' : ''}>2. Créneau</span>
                <span className={step === 'form' ? 'active' : ''}>3. Informations</span>
              </div>

              {step === 'date' && (
                <div className="booking-step-content">
                  <p className="booking-step-label">Choisissez une date parmi les disponibilités</p>
                  {availableDates.length === 0 ? (
                    <p className="booking-empty">
                      Aucune date disponible pour le moment. Le praticien ajoutera bientôt des créneaux.
                    </p>
                  ) : (
                    <div className="booking-calendar-mini">
                      {availableDates.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`booking-date-btn ${selectedDate && format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'active' : ''}`}
                          onClick={() => handleDateClick(d)}
                        >
                          <span className="booking-date-day">{format(d, 'EEE', { locale: fr })}</span>
                          <span className="booking-date-num">{format(d, 'd')}</span>
                          <span className="booking-date-month">{format(d, 'MMM', { locale: fr })}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 'slot' && selectedDate && (
                <div className="booking-step-content">
                  <button type="button" className="btn-booking-back" onClick={() => setStep('date')}>
                    ← Retour
                  </button>
                  <p className="booking-step-label">Créneaux disponibles pour le {format(selectedDate, "EEEE d MMMM", { locale: fr })}</p>
                  {slots.length === 0 ? (
                    <p className="booking-empty">Aucun créneau disponible ce jour-là.</p>
                  ) : (
                    <div className="booking-slots">
                      {slots.map((slot, i) => (
                        <button
                          key={i}
                          type="button"
                          className="booking-slot-btn"
                          onClick={() => handleSlotClick(slot)}
                        >
                          {format(slot.start, 'HH:mm', { locale: fr })} – {format(slot.end, 'HH:mm', { locale: fr })}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 'form' && selectedSlot && (
                <form className="booking-step-content" onSubmit={handleSubmit}>
                  <button type="button" className="btn-booking-back" onClick={() => setStep('slot')}>
                    ← Retour
                  </button>
                  <p className="booking-step-label">
                    Créneau sélectionné : {format(selectedSlot.start, "EEEE d MMMM à HH:mm", { locale: fr })}
                  </p>
                  {submitError && (
                    <p className="booking-error">{submitError}</p>
                  )}
                  <ReservationForm
                    data={formData}
                    onChange={setFormData}
                    submitLabel="Réserver"
                    onCancel={() => setStep('slot')}
                    disabled={loading}
                  />
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
