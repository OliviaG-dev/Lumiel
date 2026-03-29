import { useState, useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'
import AvisModal from '../../components/avis/AvisModal'
import { addAvis, loadAvisValidés } from '../../lib/avis'
import { loadPrestations } from '../../lib/prestations'
import type { Avis } from '../../types/avis'
import type { Prestation } from '../../types/prestation'
import './TemoignagesPage.css'

function couleurPrestationPourTypeSeance(typeSeance: string, byNom: Map<string, string>): string | null {
  const t = typeSeance.trim()
  if (!t) return null
  const exact = byNom.get(t)
  if (exact) return exact
  const lower = t.toLowerCase()
  for (const [nom, c] of byNom) {
    if (nom.toLowerCase() === lower) return c
  }
  return null
}

export default function TemoignagesPage() {
  const [avisModalOpen, setAvisModalOpen] = useState(false)
  const [avis, setAvis] = useState<Avis[]>([])
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const prestationCouleurByNom = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of prestations) {
      const k = p.nom.trim()
      if (k) m.set(k, p.couleur)
    }
    return m
  }, [prestations])

  const fetchAvis = async () => {
    try {
      setLoading(true)
      const data = await loadAvisValidés()
      setAvis(data)
    } catch {
      setAvis([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvis()
  }, [])

  useEffect(() => {
    loadPrestations()
      .then(setPrestations)
      .catch(() => setPrestations([]))
  }, [])

  const handleAvisSubmit = async (data: {
    prenom: string
    nom: string
    note: number
    typeSeance: string
    avis: string
  }) => {
    try {
      setSubmitError(null)
      setSubmitSuccess(false)
      await addAvis(data)
      setAvisModalOpen(false)
      setSubmitSuccess(true)
      await fetchAvis()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi.')
    }
  }

  return (
    <div className="temoignages-page">
      <section className="temoignages-content">
        <h1>Témoignages</h1>
        <p>
          Les retours d'expérience de ceux qui ont déjà franchi la porte créent un espace
          de confiance. Découvrez les avis de ceux qui ont retrouvé sérénité et équilibre.
        </p>
        <button
          type="button"
          className="btn-avis-temoignages"
          onClick={() => setAvisModalOpen(true)}
        >
          Rédiger un avis
        </button>

        {submitError && (
          <p className="temoignages-error">
            {submitError}
          </p>
        )}

        {submitSuccess && (
          <div className="temoignages-success">
            <p>Merci ! Votre avis a bien été envoyé.</p>
            <p>Il sera publié sur cette page après validation.</p>
            <button type="button" className="temoignages-success-close" onClick={() => setSubmitSuccess(false)} aria-label="Fermer">
              ×
            </button>
          </div>
        )}

        {loading ? (
          <p className="temoignages-loading">Chargement des témoignages…</p>
        ) : avis.length === 0 ? (
          <p className="temoignages-empty">
            Aucun témoignage publié pour le moment.
          </p>
        ) : (
          <ul className="temoignages-list">
            {avis.map((a) => {
              const typeAccent = a.typeSeance
                ? couleurPrestationPourTypeSeance(a.typeSeance, prestationCouleurByNom)
                : null
              const typeStyle: CSSProperties | undefined = typeAccent
                ? { '--prestation-accent': typeAccent }
                : undefined
              return (
                <li key={a.id} className="temoignages-item">
                  <p className="temoignages-item-author">
                    <span className="temoignages-item-author-name">
                      {a.prenom} {a.nom}
                    </span>
                    {a.typeSeance && (
                      <span className="temoignages-item-type" style={typeStyle}>
                        {a.typeSeance}
                      </span>
                    )}
                  </p>
                  <p className="temoignages-item-text">« {a.avis} »</p>
                  <div className="temoignages-item-stars" aria-label={`Note : ${a.note} sur 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={a.note >= n ? 'temoignages-star temoignages-star--filled' : 'temoignages-star'}>
                        ★
                      </span>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <AvisModal
        isOpen={avisModalOpen}
        onClose={() => { setAvisModalOpen(false); setSubmitError(null) }}
        onSubmit={handleAvisSubmit}
        submitError={submitError}
      />
    </div>
  )
}
