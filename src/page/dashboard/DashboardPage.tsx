import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isAdmin } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'
import './DashboardPage.css'

type TabId = 'stats' | 'autres'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('stats')
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

  const tabs = [
    { id: 'stats' as TabId, label: 'Statistiques' },
    { id: 'autres' as TabId, label: 'Autres' },
  ]

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <h1>Tableau de bord</h1>
          <p className="dashboard-welcome">Administration</p>
          <button type="button" className="btn-secondary" onClick={handleSignOut}>
            Déconnexion
          </button>
        </div>
        <nav className="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dashboard-tab ${activeTab === tab.id ? 'dashboard-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="dashboard-main">
        {activeTab === 'stats' && (
          <div className="dashboard-tab-content">
            <div className="dashboard-stats-grid">
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-value">0</span>
                <span className="dashboard-stat-label">Avis</span>
              </div>
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-value">0</span>
                <span className="dashboard-stat-label">Prestations réalisées</span>
              </div>
            </div>

            <div className="dashboard-card">
              <h2>Prestations par type</h2>
              <p className="dashboard-empty">
                Aucune prestation enregistrée. Les données apparaîtront ici une fois connectées à Supabase.
              </p>
            </div>

            <div className="dashboard-card">
              <h2>Rendez-vous à venir</h2>
              <p className="dashboard-empty">
                Aucun rendez-vous à venir. Les rendez-vous apparaîtront ici une fois le calendrier connecté.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'autres' && (
          <div className="dashboard-tab-content">
            <div className="dashboard-card">
              <h2>Autres</h2>
              <p>Section à compléter selon vos besoins.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
