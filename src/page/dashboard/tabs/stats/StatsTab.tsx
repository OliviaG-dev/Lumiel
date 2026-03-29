import { useState, useEffect, useMemo } from 'react'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { loadAvis } from '../../../../lib/avis'
import { loadPrestations } from '../../../../lib/prestations'
import { loadReservations } from '../../../../lib/reservations'
import { buildPrestationPrixLookup, sumEstimatedCaEuros } from '../../../../lib/statsCa'
import type { Prestation } from '../../../../types/prestation'
import type { Reservation } from '../../../../types/reservation'
import StatsPrestationDonut from './StatsPrestationDonut'
import { Button } from '../../../../components/button/Button'
import './StatsTab.css'

const OPEN_SLOTS_HORIZON_DAYS = 14

function isRendezVous(r: Reservation): r is Reservation & { type: 'rendez-vous' } {
  return r.type === 'rendez-vous'
}

function formatEuros(n: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatRdvDateTimeFr(date: Date) {
  const raw = format(date, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

const UPCOMING_PAGE_SIZE = 5

export default function StatsTab() {
  const [avisCount, setAvisCount] = useState<number | null>(null)
  const [prestationsRealisees, setPrestationsRealisees] = useState<number | null>(null)
  const [rdvByPrestation, setRdvByPrestation] = useState<{ nom: string; count: number }[]>([])
  const [upcomingRdv, setUpcomingRdv] = useState<Reservation[]>([])
  const [prestationsCatalog, setPrestationsCatalog] = useState<Prestation[]>([])
  const [openSlots14d, setOpenSlots14d] = useState(0)
  const [caRealiseEuros, setCaRealiseEuros] = useState(0)
  const [caUpcomingEuros, setCaUpcomingEuros] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upcomingPage, setUpcomingPage] = useState(0)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const [avis, reservations, prestations] = await Promise.all([
          loadAvis(),
          loadReservations(),
          loadPrestations().catch(() => [] as Prestation[]),
        ])
        if (cancelled) return

        setAvisCount(avis.length)
        setPrestationsCatalog(prestations)

        const rdvs = reservations.filter(isRendezVous)
        const now = new Date()
        const horizonEnd = addDays(now, OPEN_SLOTS_HORIZON_DAYS)

        const disposNext14d = reservations.filter(
          (r) =>
            r.type === 'disponibilité' &&
            r.start >= now &&
            r.start <= horizonEnd,
        )
        setOpenSlots14d(disposNext14d.length)

        const prixLookup = buildPrestationPrixLookup(prestations)
        const caPast = sumEstimatedCaEuros(rdvs, prixLookup, (r) => r.end < now)
        const caFuture = sumEstimatedCaEuros(rdvs, prixLookup, (r) => r.start >= now)
        setCaRealiseEuros(caPast.euros)
        setCaUpcomingEuros(caFuture.euros)

        const realisees = rdvs.filter((r) => r.end < now)
        setPrestationsRealisees(realisees.length)

        const byName = new Map<string, number>()
        for (const r of rdvs) {
          const key = (r.prestation ?? '').trim() || 'Autre'
          byName.set(key, (byName.get(key) ?? 0) + 1)
        }
        const sorted = [...byName.entries()]
          .map(([nom, count]) => ({ nom, count }))
          .sort((a, b) => b.count - a.count)
        setRdvByPrestation(sorted)

        const upcoming = rdvs
          .filter((r) => r.start >= now)
          .sort((a, b) => a.start.getTime() - b.start.getTime())
        setUpcomingRdv(upcoming)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Impossible de charger les statistiques.')
          setAvisCount(0)
          setPrestationsRealisees(0)
          setRdvByPrestation([])
          setUpcomingRdv([])
          setPrestationsCatalog([])
          setOpenSlots14d(0)
          setCaRealiseEuros(0)
          setCaUpcomingEuros(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(upcomingRdv.length / UPCOMING_PAGE_SIZE) - 1)
    setUpcomingPage((p) => Math.min(p, maxPage))
  }, [upcomingRdv])

  const upcomingPaginated = useMemo(() => {
    const start = upcomingPage * UPCOMING_PAGE_SIZE
    return upcomingRdv.slice(start, start + UPCOMING_PAGE_SIZE)
  }, [upcomingRdv, upcomingPage])

  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingRdv.length / UPCOMING_PAGE_SIZE))
  const showUpcomingPagination = upcomingRdv.length > UPCOMING_PAGE_SIZE

  if (loading) {
    return (
      <div className="dashboard-tab-content stats-tab" aria-busy="true" aria-label="Chargement des statistiques">
        <div className="stats-loading">
          <header className="dashboard-page-header dashboard-page-header--loading" aria-hidden="true">
            <span className="dashboard-page-header-accent" />
            <div className="dashboard-page-header-text">
              <div className="stats-skeleton stats-skeleton--page-title-main" />
              <div className="stats-skeleton stats-skeleton--page-title-sub" />
            </div>
          </header>
          <div className="stats-loading-kpis">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="stats-skeleton stats-skeleton--kpi" />
            ))}
          </div>
          <div className="stats-loading-panels">
            <div className="stats-skeleton stats-skeleton--card" />
            <div className="stats-skeleton stats-skeleton--card" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-tab-content stats-tab">
      {error && (
        <div className="stats-tab-error" role="alert">
          <span className="stats-tab-error-icon" aria-hidden="true" />
          {error}
        </div>
      )}

      <header className="dashboard-page-header">
        <span className="dashboard-page-header-accent" aria-hidden="true" />
        <div className="dashboard-page-header-text">
          <h2 className="dashboard-page-title">Vue d’ensemble</h2>
          <p className="dashboard-page-tagline">Indicateurs clés de votre activité</p>
        </div>
      </header>

      <div className="stats-kpi-grid">
        <article className="stats-kpi stats-kpi--avis">
          <div className="stats-kpi-glow" aria-hidden="true" />
          <div className="stats-kpi-inner">
            <span className="stats-kpi-icon stats-kpi-icon--avis" aria-hidden="true" />
            <div className="stats-kpi-text">
              <span className="stats-kpi-value">{avisCount ?? '–'}</span>
              <span className="stats-kpi-label">Avis</span>
            </div>
          </div>
        </article>
        <article className="stats-kpi stats-kpi--done">
          <div className="stats-kpi-glow" aria-hidden="true" />
          <div className="stats-kpi-inner">
            <span className="stats-kpi-icon stats-kpi-icon--done" aria-hidden="true" />
            <div className="stats-kpi-text">
              <span className="stats-kpi-value">{prestationsRealisees ?? '–'}</span>
              <span className="stats-kpi-label">Prestations réalisées</span>
            </div>
          </div>
        </article>
        <article className="stats-kpi stats-kpi--pending">
          <div className="stats-kpi-glow" aria-hidden="true" />
          <div className="stats-kpi-inner">
            <span className="stats-kpi-icon stats-kpi-icon--pending" aria-hidden="true" />
            <div className="stats-kpi-text">
              <span className="stats-kpi-value">{upcomingRdv.length}</span>
              <span className="stats-kpi-label">Prestations en attente</span>
            </div>
          </div>
        </article>
        <article className="stats-kpi stats-kpi--slots">
          <div className="stats-kpi-glow" aria-hidden="true" />
          <div className="stats-kpi-inner">
            <span className="stats-kpi-icon stats-kpi-icon--slots" aria-hidden="true" />
            <div className="stats-kpi-text">
              <span className="stats-kpi-value">{openSlots14d}</span>
              <span className="stats-kpi-label">Créneaux libres (14 j.)</span>
            </div>
          </div>
        </article>
        <article className="stats-kpi stats-kpi--ca-past">
          <div className="stats-kpi-glow" aria-hidden="true" />
          <div className="stats-kpi-inner">
            <span className="stats-kpi-icon stats-kpi-icon--ca" aria-hidden="true" />
            <div className="stats-kpi-text">
              <span className="stats-kpi-value">{formatEuros(caRealiseEuros)}</span>
              <span className="stats-kpi-label">CA réalisé (estim.)</span>
            </div>
          </div>
        </article>
        <article className="stats-kpi stats-kpi--ca-future">
          <div className="stats-kpi-glow" aria-hidden="true" />
          <div className="stats-kpi-inner">
            <span className="stats-kpi-icon stats-kpi-icon--ca" aria-hidden="true" />
            <div className="stats-kpi-text">
              <span className="stats-kpi-value">{formatEuros(caUpcomingEuros)}</span>
              <span className="stats-kpi-label">CA à venir (estim.)</span>
            </div>
          </div>
        </article>
      </div>

      <div className="stats-panels">
        <section className="stats-panel dashboard-card stats-panel--prestations">
          <div className="stats-panel-head">
            <h3 className="stats-panel-title">Prestations par type</h3>
          </div>
          <div className="stats-panel-body">
            {prestationsCatalog.length === 0 && rdvByPrestation.length === 0 ? (
              <p className="stats-empty">Aucun rendez-vous enregistré pour l’instant.</p>
            ) : (
              <StatsPrestationDonut catalog={prestationsCatalog} rdvByPrestation={rdvByPrestation} />
            )}
          </div>
        </section>

        <section className="stats-panel dashboard-card stats-panel--upcoming">
          <div className="stats-panel-head">
            <h3 className="stats-panel-title">Rendez-vous à venir</h3>
          </div>
          <div className="stats-panel-body">
            {upcomingRdv.length === 0 ? (
              <p className="stats-empty">Aucun rendez-vous à venir.</p>
            ) : (
              <>
                <ul className="stats-upcoming-list">
                  {upcomingPaginated.map((r) => {
                    const label = (r.prenom || r.nom)
                      ? `${r.prenom ?? ''} ${r.nom ?? ''}`.trim()
                      : 'Rendez-vous'
                    return (
                      <li key={r.id} className="stats-upcoming-item">
                        <div className="stats-upcoming-datebox" aria-hidden="true">
                          <span className="stats-upcoming-day">{format(r.start, 'd')}</span>
                          <span className="stats-upcoming-mon">{format(r.start, 'MMM', { locale: fr })}</span>
                        </div>
                        <div className="stats-upcoming-body">
                          <time
                            dateTime={r.start.toISOString()}
                            className="stats-upcoming-time"
                            title={formatRdvDateTimeFr(r.start)}
                          >
                            {format(r.start, 'HH:mm')}
                          </time>
                          <span className="stats-upcoming-meta">
                            <span className="stats-upcoming-presta">{r.prestation ?? 'Prestation'}</span>
                            <span className="stats-upcoming-sep">·</span>
                            <span className="stats-upcoming-client">{label}</span>
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {showUpcomingPagination && (
                  <nav className="stats-upcoming-pagination" aria-label="Pagination des rendez-vous">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="stats-upcoming-page-btn"
                      disabled={upcomingPage <= 0}
                      onClick={() => setUpcomingPage((p) => Math.max(0, p - 1))}
                      aria-label="Page précédente"
                    >
                      ‹
                    </Button>
                    <span className="stats-upcoming-page-info">
                      {upcomingPage + 1} / {upcomingTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="stats-upcoming-page-btn"
                      disabled={upcomingPage >= upcomingTotalPages - 1}
                      onClick={() =>
                        setUpcomingPage((p) => Math.min(upcomingTotalPages - 1, p + 1))
                      }
                      aria-label="Page suivante"
                    >
                      ›
                    </Button>
                  </nav>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
