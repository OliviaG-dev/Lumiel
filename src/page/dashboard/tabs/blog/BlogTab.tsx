import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  loadBlogPosts,
  addBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../../../../lib/blogPosts'
import type { BlogPost } from '../../../../types/blogPost'
import ConfirmModal from '../../../../components/confirm/ConfirmModal'
import BlogPostFormModal from './BlogPostFormModal'
import './BlogTab.css'

export default function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await loadBlogPosts()
      setPosts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement des articles.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleSave = async (data: {
    slug: string
    title: string
    excerpt: string
    body: string
    imageUrl: string | null
    published: boolean
  }) => {
    if (editingPost) {
      await updateBlogPost(editingPost.id, data)
    } else {
      await addBlogPost(data)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return
    try {
      setActionLoading(confirmDeleteId)
      await deleteBlogPost(confirmDeleteId)
      await fetchPosts()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression.')
    } finally {
      setActionLoading(null)
      setConfirmDeleteId(null)
    }
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) {
    return (
      <div className="dashboard-tab-content">
        <div className="dashboard-card">
          <div className="blog-tab-loading">Chargement du blog…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-tab-content">
      <div className="dashboard-card blog-tab-card">
        <header className="blog-tab-header">
          <div>
            <h2>Gestion du blog</h2>
            <p className="blog-tab-intro">
              Rédigez des articles avec texte et image ; les brouillons restent privés jusqu’à publication.
            </p>
          </div>
          <button
            type="button"
            className="blog-tab-btn-new"
            onClick={() => {
              setEditingPost(null)
              setFormOpen(true)
            }}
          >
            Nouvel article
          </button>
        </header>

        {error && (
          <div className="blog-tab-error">
            {error}
            <button type="button" onClick={() => setError(null)} aria-label="Fermer">
              ×
            </button>
          </div>
        )}

        {posts.length === 0 ? (
          <p className="dashboard-empty">Aucun article pour le moment.</p>
        ) : (
          <ul className="blog-tab-list">
            {posts.map((p) => (
              <li key={p.id} className="blog-tab-item">
                <div className="blog-tab-item-visual">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="blog-tab-thumb" decoding="async" />
                  ) : (
                    <div className="blog-tab-thumb blog-tab-thumb--placeholder" aria-hidden />
                  )}
                </div>
                <div className="blog-tab-item-body">
                  <div className="blog-tab-item-meta">
                    <span className={`blog-tab-badge ${p.published ? 'blog-tab-badge--live' : 'blog-tab-badge--draft'}`}>
                      {p.published ? 'Publié' : 'Brouillon'}
                    </span>
                    <time dateTime={p.updatedAt.toISOString()}>{formatDate(p.updatedAt)}</time>
                  </div>
                  <h3 className="blog-tab-item-title">{p.title}</h3>
                  {p.excerpt ? <p className="blog-tab-item-excerpt">{p.excerpt}</p> : null}
                  <div className="blog-tab-item-actions">
                    {p.published ? (
                      <Link to={`/blog/${encodeURIComponent(p.slug)}`} className="blog-tab-link" target="_blank" rel="noopener noreferrer">
                        Voir sur le site
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="blog-tab-btn-edit"
                      onClick={() => {
                        setEditingPost(p)
                        setFormOpen(true)
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="blog-tab-btn-delete"
                      disabled={actionLoading === p.id}
                      onClick={() => setConfirmDeleteId(p.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BlogPostFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingPost(null)
        }}
        onSaved={fetchPosts}
        post={editingPost}
        saveFn={handleSave}
      />

      {confirmDeleteId && (
        <ConfirmModal
          isOpen
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={handleConfirmDelete}
          title="Supprimer l’article"
          message="Supprimer cet article définitivement ?"
          confirmLabel="Supprimer"
          variant="danger"
        />
      )}
    </div>
  )
}
