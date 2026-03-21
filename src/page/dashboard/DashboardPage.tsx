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
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        navigate('/login')
        return
      }
      // Déporter les appels async hors du callback pour éviter les blocages Supabase Auth
      const email = session.user.email ?? ''
      setTimeout(async () => {
        if (!mounted) return
        try {
          const admin = await isAdmin(email)
          if (!mounted) return
          if (!admin) {
            await supabase.auth.signOut()
            navigate('/login')
            return
          }
          setUser(session.user)
        } catch {
          if (mounted) navigate('/login')
        } finally {
          if (mounted) setLoading(false)
        }
      }, 50)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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
