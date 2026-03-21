import { useState, useEffect } from 'react'
import AvisModal from '../../components/avis/AvisModal'
import { addAvis, loadAvisValidés } from '../../lib/avis'
import type { Avis } from '../../types/avis'
import './TemoignagesPage.css'

export default function TemoignagesPage() {
  const [avisModalOpen, setAvisModalOpen] = useState(false)
  const [avis, setAvis] = useState<Avis[]>([])
  const [loading, setLoading] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

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
            {avis.map((a) => (
              <li key={a.id} className="temoignages-item">
                <div className="temoignages-item-stars" aria-label={`Note : ${a.note} sur 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={a.note >= n ? 'temoignages-star temoignages-star--filled' : 'temoignages-star'}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="temoignages-item-text">« {a.avis} »</p>
                <p className="temoignages-item-author">
                  — {a.prenom} {a.nom}
                  {a.typeSeance && <span className="temoignages-item-type">{a.typeSeance}</span>}
                </p>
              </li>
            ))}
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
