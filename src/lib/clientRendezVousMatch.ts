import type { Client } from '../types/client'
import type { Reservation } from '../types/reservation'

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/** Chiffres uniquement, pour comparaison téléphone. */
export function normalizePhone(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

/** Longueur min. du numéro (chiffres) pour qu’un portable soit considéré comme fiable. */
export const MIN_PHONE_LEN = 8

/**
 * Associe un rendez-vous du calendrier à une fiche client (même e-mail ou même n° portable).
 */
export function reservationMatchesClient(r: Reservation, client: Client): boolean {
  if (r.type !== 'rendez-vous') return false

  const rEmail = normalizeEmail(r.email ?? '')
  const cEmail = normalizeEmail(client.email)
  if (rEmail && cEmail && rEmail === cEmail) return true

  const rPhone = normalizePhone(r.telephone)
  const cPhone = normalizePhone(client.telephone)
  if (
    rPhone.length >= MIN_PHONE_LEN &&
    cPhone.length >= MIN_PHONE_LEN &&
    rPhone === cPhone
  ) {
    return true
  }

  return false
}
