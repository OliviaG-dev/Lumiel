import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRESTATION_COLOR,
  normalizePrestationCouleur,
  prestationModalItemStyles,
  rdvEventStylesFromCouleur,
} from '@/lib/prestationColors'

describe('normalizePrestationCouleur', () => {
  it('returns default for nullish or non-string', () => {
    expect(normalizePrestationCouleur(null)).toBe(DEFAULT_PRESTATION_COLOR)
    expect(normalizePrestationCouleur(undefined)).toBe(DEFAULT_PRESTATION_COLOR)
    expect(normalizePrestationCouleur('')).toBe(DEFAULT_PRESTATION_COLOR)
  })

  it('returns default for unknown hex', () => {
    expect(normalizePrestationCouleur('#ff0000')).toBe(DEFAULT_PRESTATION_COLOR)
  })

  it('accepts allowed colors case-insensitive and trimmed', () => {
    expect(normalizePrestationCouleur('  #7A8FD4  ')).toBe('#7a8fd4')
    expect(normalizePrestationCouleur('#5c7cba')).toBe('#5c7cba')
  })
})

describe('rdvEventStylesFromCouleur', () => {
  it('returns border, background and color for a valid hex', () => {
    const styles = rdvEventStylesFromCouleur('#7a8fd4')
    expect(styles.border).toMatch(/1px solid/)
    expect(styles.background).toContain('linear-gradient')
    expect(styles.color).toBe('#05070a')
  })

  it('falls back to default for invalid hex', () => {
    const styles = rdvEventStylesFromCouleur('#bad')
    const expected = rdvEventStylesFromCouleur(DEFAULT_PRESTATION_COLOR)
    expect(styles.background).toBe(expected.background)
  })
})

describe('prestationModalItemStyles', () => {
  it('sets borderLeft to normalized color', () => {
    expect(prestationModalItemStyles('#7A8FD4')).toEqual({
      borderLeft: '4px solid #7a8fd4',
    })
  })
})
