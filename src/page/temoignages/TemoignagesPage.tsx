import { useState } from 'react'
import AvisModal from '../../components/avis/AvisModal'
import './TemoignagesPage.css'

export default function TemoignagesPage() {
  const [avisModalOpen, setAvisModalOpen] = useState(false)

  const handleAvisSubmit = (data: { prenom: string; nom: string; note: number; typeSeance: string; avis: string }) => {
    // TODO: envoyer vers Supabase ou API
    console.log('Avis reçu:', data)
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
      </section>

      <AvisModal
        isOpen={avisModalOpen}
        onClose={() => setAvisModalOpen(false)}
        onSubmit={handleAvisSubmit}
      />
    </div>
  )
}
