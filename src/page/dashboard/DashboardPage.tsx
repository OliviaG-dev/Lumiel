import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isAdmin } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'
import {
  type TabId,
  StatsTab,
  BlogTab,
  AvisTab,
  CalendrierTab,
  AutresTab,
} from './tabs'
import './DashboardPage.css'

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

  const tabs: { id: TabId; label: string }[] = [
    { id: 'stats', label: 'Statistiques' },
    { id: 'blog', label: 'Blog' },
    { id: 'avis', label: 'Avis' },
    { id: 'calendrier', label: 'Calendrier' },
    { id: 'autres', label: 'Autres' },
  ]

  const tabContent: Record<TabId, React.ReactNode> = {
    stats: <StatsTab />,
    blog: <BlogTab />,
    avis: <AvisTab />,
    calendrier: <CalendrierTab />,
    autres: <AutresTab />,
  }

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
        {tabContent[activeTab]}
      </main>
    </div>
  )
}
