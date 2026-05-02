import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isAdmin } from '@/lib/supabase'
import './LoginPage.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (!data.user?.email) throw new Error('Email non trouvé')

      const admin = await isAdmin(data.user.email)
      if (!admin) {
        await supabase.auth.signOut()
        throw new Error('Accès refusé. Vous n\'avez pas les droits administrateur.')
      }

      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-content">
        <h1>Connexion</h1>
        <p className="login-subtitle">Accédez à votre tableau de bord</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            autoComplete="email"
          />

          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Chargement...' : 'Se connecter'}
          </button>
        </form>

        <Link to="/" className="login-back">
          ← Retour à l'accueil
        </Link>
      </section>
    </div>
  )
}
