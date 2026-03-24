import { useId, useMemo } from 'react'
import type { Prestation } from '../../../../types/prestation'
import { PRESTATION_COLOR_OPTIONS } from '../../../../lib/prestationColors'

type CountRow = { nom: string; count: number }

function slicePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1 = cx + outerR * Math.cos(startAngle)
  const y1 = cy + outerR * Math.sin(startAngle)
  const x2 = cx + outerR * Math.cos(endAngle)
  const y2 = cy + outerR * Math.sin(endAngle)
  const x3 = cx + innerR * Math.cos(endAngle)
  const y3 = cy + innerR * Math.sin(endAngle)
  const x4 = cx + innerR * Math.cos(startAngle)
  const y4 = cy + innerR * Math.sin(startAngle)
  const sweep = endAngle - startAngle
  const largeArc = sweep > Math.PI ? 1 : 0
  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ')
}

type LegendRow = { nom: string; count: number; color: string; pct: number }

type Segment = LegendRow & { path: string }

interface StatsPrestationDonutProps {
  /** Prestations configurées (couleurs officielles) — ordre d’affichage légende */
  catalog: Prestation[]
  /** Comptages par nom (issus des RDV) */
  rdvByPrestation: CountRow[]
}

const VIEW = 200
const CX = VIEW / 2
const CY = VIEW / 2
const OUTER = 82
const INNER = 48

function orphanColor(index: number) {
  return PRESTATION_COLOR_OPTIONS[index % PRESTATION_COLOR_OPTIONS.length].hex
}

export default function StatsPrestationDonut({ catalog, rdvByPrestation }: StatsPrestationDonutProps) {
  const filterId = `stats-donut-${useId().replace(/:/g, '')}`

  const { legendRows, segments, total } = useMemo(() => {
    const countMap = new Map<string, number>()
    for (const { nom, count } of rdvByPrestation) {
      countMap.set(nom, count)
    }

    const catalogSorted = [...catalog].sort((a, b) => {
      if (a.ordre !== b.ordre) return a.ordre - b.ordre
      return a.nom.localeCompare(b.nom, 'fr')
    })
    const catalogNameSet = new Set(catalogSorted.map((p) => p.nom.trim()))

    const legend: LegendRow[] = []

    for (const p of catalogSorted) {
      const key = p.nom.trim()
      const count = countMap.get(key) ?? 0
      legend.push({
        nom: key,
        count,
        color: p.couleur,
        pct: 0,
      })
    }

    let orphanIdx = 0
    const extras: { nom: string; count: number }[] = []
    for (const [nom, count] of countMap) {
      if (!catalogNameSet.has(nom)) {
        extras.push({ nom, count })
      }
    }
    extras.sort((a, b) => b.count - a.count || a.nom.localeCompare(b.nom, 'fr'))
    for (const { nom, count } of extras) {
      legend.push({
        nom,
        count,
        color: orphanColor(orphanIdx++),
        pct: 0,
      })
    }

    const totalCount = [...countMap.values()].reduce((s, n) => s + n, 0)
    const legendRows: LegendRow[] = legend.map((row) => ({
      ...row,
      pct: totalCount > 0 ? Math.round((row.count / totalCount) * 1000) / 10 : 0,
    }))

    const forDonut = legendRows.filter((r) => r.count > 0)
    const segs: Segment[] = []
    if (totalCount > 0 && forDonut.length > 0) {
      const startBase = -Math.PI / 2
      let angle = startBase
      for (const item of forDonut) {
        const sweep = (item.count / totalCount) * Math.PI * 2
        const end = angle + sweep
        segs.push({
          ...item,
          path: slicePath(CX, CY, INNER, OUTER, angle, end),
        })
        angle = end
      }
    }

    return { legendRows, segments: segs, total: totalCount }
  }, [catalog, rdvByPrestation])

  const ariaLabel = useMemo(() => {
    const parts = legendRows.map((s) => `${s.nom}: ${s.count} (${s.pct}%)`)
    return `Répartition des ${total} rendez-vous. ${parts.join('. ')}`
  }, [legendRows, total])

  const hasCatalog = catalog.length > 0

  return (
    <div className="stats-donut">
      <div className="stats-donut-chart">
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className="stats-donut-svg"
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <filter id={`${filterId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {total === 0 && (
            <circle
              cx={CX}
              cy={CY}
              r={(OUTER + INNER) / 2}
              fill="none"
              stroke="rgba(107, 123, 158, 0.14)"
              strokeWidth={OUTER - INNER}
            />
          )}
          {segments.map((s, i) => (
            <path
              key={`${s.nom}-${i}`}
              d={s.path}
              fill={s.color}
              fillOpacity={0.92}
              stroke="rgba(15, 17, 22, 0.35)"
              strokeWidth={0.75}
              filter={`url(#${filterId}-glow)`}
              className="stats-donut-segment"
            />
          ))}
        </svg>
        <div className="stats-donut-center" aria-hidden="true">
          <span className="stats-donut-center-value">{total}</span>
          <span className="stats-donut-center-label">RDV</span>
        </div>
      </div>

      <ul className="stats-donut-legend" aria-label={hasCatalog ? 'Toutes les prestations' : 'Répartition'}>
        {legendRows.map((s, i) => (
          <li key={`${s.nom}-${i}`} className="stats-donut-legend-item">
            <span className="stats-donut-swatch" style={{ background: s.color }} />
            <span className="stats-donut-legend-name">{s.nom}</span>
            <span className="stats-donut-legend-meta">
              {s.count}
              <span className="stats-donut-legend-pct"> ({s.pct}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
