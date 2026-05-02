import type { Prestation } from '@/types/prestation'
import type { Reservation } from '@/types/reservation'

function normPrestationLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Libellé prestation (RDV) → prix catalogue, comparaison normalisée (casse, espaces). */
export function buildPrestationPrixLookup(prestations: Prestation[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const p of prestations) {
    m.set(normPrestationLabel(p.nom), p.prix)
  }
  return m
}

export interface EstimatedCaResult {
  euros: number
  matchedCount: number
  unmatchedCount: number
}

/**
 * Somme des prix catalogue pour les RDV qui passent le filtre.
 * Les RDV sans libellé ou sans correspondance exacte (après normalisation) sont comptés dans unmatchedCount.
 */
export function sumEstimatedCaEuros(
  rdvs: Reservation[],
  lookup: Map<string, number>,
  filter: (r: Reservation) => boolean,
): EstimatedCaResult {
  let euros = 0
  let matchedCount = 0
  let unmatchedCount = 0
  for (const r of rdvs) {
    if (!filter(r)) continue
    const key = normPrestationLabel(r.prestation ?? '')
    if (!key) {
      unmatchedCount++
      continue
    }
    const prix = lookup.get(key)
    if (prix === undefined) {
      unmatchedCount++
      continue
    }
    euros += prix
    matchedCount++
  }
  return { euros, matchedCount, unmatchedCount }
}
