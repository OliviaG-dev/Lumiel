import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isAdmin } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'
import './DashboardPage.css'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        navigate('/login')
        return
      }
      const admin = await isAdmin(user.email ?? '')
      if (!admin) {
        await supabase.auth.signOut()
        navigate('/login')
        return
      }
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null)
        navigate('/login')
        return
      }
      const admin = await isAdmin(session.user.email ?? '')
      if (!admin) {
        await supabase.auth.signOut()
        navigate('/login')
        return
      }
      setUser(session.user)
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">Chargement...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="dashboard-page">
      <section className="dashboard-content">
        <div className="dashboard-header">
          <h1>Tableau de bord</h1>
          <button type="button" className="btn-secondary" onClick={handleSignOut}>
            Déconnexion
          </button>
        </div>
        <p className="dashboard-welcome">
          Bienvenue, <strong>{user.email}</strong>
        </p>
        <div className="dashboard-card">
          <h2>Votre espace</h2>
          <p>
            Vous êtes connecté à votre espace personnel Lumiel.
            Cette page pourra afficher vos rendez-vous, séances et informations.
          </p>
        </div>
      </section>
    </div>
  )
}
