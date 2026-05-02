import { describe, expect, it } from 'vitest'
import type { Client } from '@/types/client'
import type { Reservation } from '@/types/reservation'
import {
  MIN_PHONE_LEN,
  normalizeEmail,
  normalizePhone,
  reservationMatchesClient,
} from '@/lib/clientRendezVousMatch'

const baseDate = () => ({
  start: new Date('2026-05-01T10:00:00'),
  end: new Date('2026-05-01T11:00:00'),
})

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'c1',
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie@example.com',
    telephone: '06 12 34 56 78',
    notes: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function makeRdv(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'r1',
    type: 'rendez-vous',
    ...baseDate(),
    ...overrides,
  }
}

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Marie@EXAMPLE.COM  ')).toBe('marie@example.com')
  })
})

describe('normalizePhone', () => {
  it('returns empty string for nullish', () => {
    expect(normalizePhone(null)).toBe('')
    expect(normalizePhone(undefined)).toBe('')
  })

  it('keeps digits only', () => {
    expect(normalizePhone('+33 6 12 34 56 78')).toBe('33612345678')
  })
})

describe('reservationMatchesClient', () => {
  it('returns false for disponibilité', () => {
    const r = { id: 'd1', type: 'disponibilité' as const, ...baseDate() }
    expect(reservationMatchesClient(r, makeClient())).toBe(false)
  })

  it('matches on same email ignoring case and spaces', () => {
    const r = makeRdv({ email: '  MARIE@example.COM  ' })
    expect(reservationMatchesClient(r, makeClient({ email: 'marie@example.com' }))).toBe(true)
  })

  it('matches on phone when both sides have at least MIN_PHONE_LEN digits', () => {
    const r = makeRdv({ email: '', telephone: '06.12.34.56.78' })
    const client = makeClient({ email: 'other@x.com', telephone: '(06) 12 34 56 78' })
    expect(normalizePhone(r.telephone)).toBe(normalizePhone(client.telephone))
    expect(normalizePhone(r.telephone).length).toBeGreaterThanOrEqual(MIN_PHONE_LEN)
    expect(reservationMatchesClient(r, client)).toBe(true)
  })

  it('does not match on phone alone when numbers are too short', () => {
    const r = makeRdv({ email: 'a@b.co', telephone: '1234567' })
    const client = makeClient({ email: 'x@y.z', telephone: '1234567' })
    expect(reservationMatchesClient(r, client)).toBe(false)
  })

  it('does not match when emails differ and phones differ', () => {
    const r = makeRdv({ email: 'a@b.com', telephone: '0611111111' })
    const client = makeClient({ email: 'c@d.com', telephone: '0622222222' })
    expect(reservationMatchesClient(r, client)).toBe(false)
  })
})
