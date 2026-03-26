import type { CSSProperties } from 'react'

/** Palette fixe (9) — bleu, vert, sable, lavande, rose (Lumiel) */
export const PRESTATION_COLOR_OPTIONS = [
  { hex: '#7a8fd4', label: 'Bleu Lumiel' },
  { hex: '#5c7cba', label: 'Azur' },
  { hex: '#6b9fb8', label: 'Lagune' },
  { hex: '#8fa885', label: 'Sauge' },
  { hex: '#b89f8a', label: 'Sable' },
  { hex: '#a894c4', label: 'Lavande' },
  { hex: '#74a3b0', label: 'Ardoise' },
  { hex: '#c4a882', label: 'Doré' },
  { hex: '#b07a8a', label: 'Rose thé' },
] as const

export type PrestationHex = (typeof PRESTATION_COLOR_OPTIONS)[number]['hex']

export const DEFAULT_PRESTATION_COLOR: PrestationHex = PRESTATION_COLOR_OPTIONS[0].hex

const ALLOWED = new Set(PRESTATION_COLOR_OPTIONS.map((c) => c.hex.toLowerCase()))

export function normalizePrestationCouleur(hex: string | null | undefined): PrestationHex {
  if (!hex || typeof hex !== 'string') return DEFAULT_PRESTATION_COLOR
  const h = hex.trim().toLowerCase()
  return (ALLOWED.has(h) ? h : DEFAULT_PRESTATION_COLOR) as PrestationHex
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Styles pour un RDV calendrier selon la couleur prestation */
export function rdvEventStylesFromCouleur(hex: string): CSSProperties {
  const c = normalizePrestationCouleur(hex)
  const { r, g, b } = hexToRgb(c)
  const r2 = Math.max(0, r - 28)
  const g2 = Math.max(0, g - 28)
  const b2 = Math.max(0, b - 28)
  return {
    border: `1px solid rgba(${r},${g},${b},0.5)`,
    background: `linear-gradient(145deg, rgba(${r},${g},${b},0.9) 0%, rgba(${r2},${g2},${b2},0.82) 100%)`,
    color: '#05070a',
    boxShadow: `
      0 1px 0 rgba(255, 255, 255, 0.35) inset,
      0 2px 0 rgba(0, 0, 0, 0.04) inset,
      0 4px 14px rgba(${r2},${g2},${b2},0.25)
    `,
  }
}

/** Liste « jour » (modal) : seul le filet gauche couleur prestation (fond = styles .calendrier-modal-item) */
export function prestationModalItemStyles(hex: string | null | undefined): CSSProperties {
  const c = normalizePrestationCouleur(hex)
  return {
    borderLeft: `4px solid ${c}`,
  }
}
