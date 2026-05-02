import { describe, expect, it } from 'vitest'
import type { Prestation } from '@/types/prestation'
import type { Reservation } from '@/types/reservation'
import { buildPrestationPrixLookup, sumEstimatedCaEuros } from '@/lib/statsCa'

function makePrestation(overrides: Partial<Prestation> & Pick<Prestation, 'nom' | 'prix'>): Prestation {
  return {
    id: 'p1',
    description: '',
    duree: 60,
    couleur: '#7a8fd4',
    ordre: 0,
    createdAt: new Date(),
    ...overrides,
  }
}

function makeRdv(
  id: string,
  prestation: string | undefined,
  start: Date,
): Reservation {
  return {
    id,
    type: 'rendez-vous',
    start,
    end: new Date(start.getTime() + 3600000),
    prestation,
  }
}

describe('buildPrestationPrixLookup', () => {
  it('normalizes names for keys (trim, case, spaces)', () => {
    const prestations = [
      makePrestation({ nom: '  Massage  relaxant  ', prix: 50 }),
      makePrestation({ nom: 'Réflexologie', prix: 45 }),
    ]
    const lookup = buildPrestationPrixLookup(prestations)
    expect(lookup.get('massage relaxant')).toBe(50)
    expect(lookup.get('réflexologie')).toBe(45)
  })

  it('last prestation wins on duplicate normalized name', () => {
    const prestations = [
      makePrestation({ nom: 'Soin', prix: 40 }),
      makePrestation({ nom: '  SOIN  ', prix: 55 }),
    ]
    const lookup = buildPrestationPrixLookup(prestations)
    expect(lookup.get('soin')).toBe(55)
  })
})

describe('sumEstimatedCaEuros', () => {
  const lookup = new Map([
    ['massage', 60],
    ['soin', 30],
  ])
  const t0 = new Date(2026, 4, 10, 10, 0, 0)

  it('sums only filtered RDV with matching prestation label', () => {
    const rdvs = [
      makeRdv('a', 'Massage', t0),
      makeRdv('b', 'SOIN', new Date(t0.getTime() + 3600000)),
      makeRdv('c', 'Inconnu', new Date(t0.getTime() + 7200000)),
    ]
    const result = sumEstimatedCaEuros(rdvs, lookup, () => true)
    expect(result.euros).toBe(90)
    expect(result.matchedCount).toBe(2)
    expect(result.unmatchedCount).toBe(1)
  })

  it('counts empty prestation as unmatched', () => {
    const rdvs = [makeRdv('a', undefined, t0), makeRdv('b', '', t0)]
    const result = sumEstimatedCaEuros(rdvs, lookup, () => true)
    expect(result.euros).toBe(0)
    expect(result.matchedCount).toBe(0)
    expect(result.unmatchedCount).toBe(2)
  })

  it('respects filter', () => {
    const rdvs = [
      makeRdv('keep', 'massage', t0),
      makeRdv('skip', 'massage', new Date(t0.getTime() + 1)),
    ]
    const result = sumEstimatedCaEuros(rdvs, lookup, (r) => r.id === 'keep')
    expect(result.euros).toBe(60)
    expect(result.matchedCount).toBe(1)
    expect(result.unmatchedCount).toBe(0)
  })
})
