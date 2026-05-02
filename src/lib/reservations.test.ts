import { describe, expect, it } from 'vitest'
import type { Reservation } from '@/types/reservation'
import { getAvailableSlots, getDatesWithAvailability } from '@/lib/reservations'

/** 1er mai 2026, heure locale */
const MAY_1 = new Date(2026, 4, 1)
const MAY_2 = new Date(2026, 4, 2)

function atMay1(h: number, m: number): Date {
  return new Date(2026, 4, 1, h, m, 0, 0)
}

function atMay2(h: number, m: number): Date {
  return new Date(2026, 4, 2, h, m, 0, 0)
}

function dispo(id: string, start: Date, end: Date): Reservation {
  return { id, type: 'disponibilité', start, end }
}

function rdv(id: string, start: Date, end: Date): Reservation {
  return {
    id,
    type: 'rendez-vous',
    start,
    end,
    prestation: 'Soin',
    nom: 'D',
    prenom: 'M',
    email: 'd@m.fr',
  }
}

describe('getAvailableSlots', () => {
  it('returns empty when no disponibilités overlap the day', () => {
    const reservations: Reservation[] = [
      rdv('1', atMay1(10, 0), atMay1(11, 0)),
    ]
    expect(getAvailableSlots(MAY_1, reservations, 60)).toEqual([])
  })

  it('splits a full dispo into 60-minute slots', () => {
    const reservations: Reservation[] = [dispo('d1', atMay1(9, 0), atMay1(12, 0))]
    const slots = getAvailableSlots(MAY_1, reservations, 60)
    expect(slots).toHaveLength(3)
    expect(slots[0]).toEqual({ start: atMay1(9, 0), end: atMay1(10, 0) })
    expect(slots[1]).toEqual({ start: atMay1(10, 0), end: atMay1(11, 0) })
    expect(slots[2]).toEqual({ start: atMay1(11, 0), end: atMay1(12, 0) })
  })

  it('subtracts rendez-vous inside dispo and splits remainders', () => {
    const reservations: Reservation[] = [
      dispo('d1', atMay1(9, 0), atMay1(12, 0)),
      rdv('r1', atMay1(10, 0), atMay1(11, 0)),
    ]
    const slots = getAvailableSlots(MAY_1, reservations, 60)
    expect(slots).toHaveLength(2)
    expect(slots[0]).toEqual({ start: atMay1(9, 0), end: atMay1(10, 0) })
    expect(slots[1]).toEqual({ start: atMay1(11, 0), end: atMay1(12, 0) })
  })
})

describe('getDatesWithAvailability', () => {
  it('lists only days that have at least one slot for the duration', () => {
    const reservations: Reservation[] = [
      dispo('d1', atMay2(9, 0), atMay2(10, 30)),
    ]
    const dates = getDatesWithAvailability(reservations, MAY_1, 60, 5)
    expect(dates.map((d) => d.getDate())).toEqual([2])
  })

  it('returns empty when nothing fits duration inside dispo', () => {
    const reservations: Reservation[] = [
      dispo('d1', atMay2(9, 0), atMay2(9, 45)),
    ]
    const dates = getDatesWithAvailability(reservations, MAY_2, 60, 3)
    expect(dates).toEqual([])
  })
})
