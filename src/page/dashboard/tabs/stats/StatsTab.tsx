import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { loadAvis } from '../../../../lib/avis'
import { loadPrestations } from '../../../../lib/prestations'
import { loadReservations } from '../../../../lib/reservations'
import type { Prestation } from '../../../../types/prestation'
import type { Reservation } from '../../../../types/reservation'
import StatsPrestationDonut from './StatsPrestationDonut'
import './StatsTab.css'

function isRendezVous(r: Reservation): r is Reservation & { type: 'rendez-vous' } {
  return r.type === 'rendez-vous'
}

function formatRdvDateTimeFr(date: Date) {
  const raw = format(date, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

const UPCOMING_PAGE_SIZE = 4

export default function StatsTab() {
  const [avisCount, setAvisCount] = useState<number | null>(null)
  const [prestationsRealisees, setPrestationsRealisees] = useState<number | null>(null)
  const [rdvByPrestation, setRdvByPrestation] = useState<{ nom: string; count: number }[]>([])
  const [upcomingRdv, setUpcomingRdv] = useState<Reservation[]>([])
  const [prestationsCatalog, setPrestationsCatalog] = useState<Prestation[]>([])
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
          <div className="stats-skeleton stats-skeleton--title" />
          <div className="stats-loading-kpis">
            <div className="stats-skeleton stats-skeleton--kpi" />
            <div className="stats-skeleton stats-skeleton--kpi" />
            <div className="stats-skeleton stats-skeleton--kpi" />
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

      <h2 className="stats-header-title">Vue d’ensemble</h2>

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
                    <button
                      type="button"
                      className="stats-upcoming-page-btn"
                      disabled={upcomingPage <= 0}
                      onClick={() => setUpcomingPage((p) => Math.max(0, p - 1))}
                      aria-label="Page précédente"
                    >
                      ‹
                    </button>
                    <span className="stats-upcoming-page-info">
                      {upcomingPage + 1} / {upcomingTotalPages}
                    </span>
                    <button
                      type="button"
                      className="stats-upcoming-page-btn"
                      disabled={upcomingPage >= upcomingTotalPages - 1}
                      onClick={() =>
                        setUpcomingPage((p) => Math.min(upcomingTotalPages - 1, p + 1))
                      }
                      aria-label="Page suivante"
                    >
                      ›
                    </button>
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
