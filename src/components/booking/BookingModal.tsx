import { useState, useCallback, useEffect } from 'react'
import { format, addMinutes } from 'date-fns'
import { fr } from 'date-fns/locale'
import { loadReservations, addRendezVous, getAvailableSlots, getDatesWithAvailability } from '../../lib/reservations'
import { loadPrestations } from '../../lib/prestations'
import type { Prestation } from '../../types/prestation'
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
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && !submitted) {
      loadReservations().then(setReservations)
      loadPrestations().then((p) => {
        setPrestations(p)
        if (p.length) {
          setFormData((prev) => (p.some((x) => x.nom === prev.prestation) ? prev : { ...prev, prestation: p[0].nom }))
        }
      })
    }
  }, [isOpen, submitted])

  const prestationDuree =
    prestations.find((p) => p.nom === formData.prestation)?.duree ?? 60
  const availableDates = getDatesWithAvailability(reservations, new Date(), prestationDuree, 60)
  const slots = selectedDate
    ? getAvailableSlots(selectedDate, reservations, prestationDuree)
    : []

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
    const slotDurationMin = (selectedSlot.end.getTime() - selectedSlot.start.getTime()) / 60000
    /* Durée imposée par la prestation (pas de choix client à l’étape Infos) */
    const duree = Math.min(prestationDuree, slotDurationMin)
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
              <button type="button" className="booking-success-btn" onClick={handleClose}>
                Fermer
              </button>
            </div>
          ) : (
            <>
              <div className="booking-steps">
                <button
                  type="button"
                  className={`booking-step-item ${step === 'date' ? 'active' : step !== 'date' ? 'done' : ''}`}
                  onClick={() => {
                    setStep('date')
                    setSelectedDate(null)
                    setSelectedSlot(null)
                  }}
                  disabled={step === 'date'}
                  aria-label="Étape 1 : Date"
                  aria-current={step === 'date' ? 'step' : undefined}
                >
                  <span className="booking-step-num">1</span>
                  <span className="booking-step-label-inline">Date</span>
                </button>
                <div className="booking-step-connector" />
                <button
                  type="button"
                  className={`booking-step-item ${step === 'slot' ? 'active' : step === 'form' ? 'done' : ''}`}
                  onClick={() => {
                    if (step === 'form' && selectedDate) {
                      setStep('slot')
                      setSelectedSlot(null)
                    }
                  }}
                  disabled={step === 'date' || !selectedDate}
                  aria-label="Étape 2 : Créneau"
                  aria-current={step === 'slot' ? 'step' : undefined}
                >
                  <span className="booking-step-num">2</span>
                  <span className="booking-step-label-inline">Créneau</span>
                </button>
                <div className="booking-step-connector" />
                <div
                  className={`booking-step-item booking-step-item--static ${step === 'form' ? 'active' : ''}`}
                  role="status"
                  aria-label="Étape 3 : Informations"
                >
                  <span className="booking-step-num">3</span>
                  <span className="booking-step-label-inline">Infos</span>
                </div>
              </div>

              {step === 'date' && (
                <div className="booking-step-content">
                  <div className="booking-step-row">
                    <label className="booking-step-label">Prestation</label>
                    <select
                      className="booking-prestation-select"
                      value={formData.prestation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, prestation: e.target.value }))}
                    >
                      {(prestations.length ? prestations.map((p) => p.nom) : ['Massage bien-être', 'Reiki', 'Soin énergétique', 'Consultation', 'Autre']).map((nom) => (
                        <option key={nom} value={nom}>
                          {nom}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    hidePrestation
                    hideDuree
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
