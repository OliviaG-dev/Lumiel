import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  loadBlogPosts,
  addBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../../../../lib/blogPosts'
import type { BlogPost } from '../../../../types/blogPost'
import ConfirmModal from '../../../../components/confirm/ConfirmModal'
import Pagination, { getTotalPages } from '../../../../components/pagination/Pagination'
import { Button } from '../../../../components/button/Button'
import BlogPostFormModal from './BlogPostFormModal'
import './BlogTab.css'

/** Nombre d’articles par page dans l’onglet blog du dashboard. */
const PAGE_SIZE = 2

export default function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [listPage, setListPage] = useState(1)
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

  const totalPages = useMemo(() => getTotalPages(posts.length, PAGE_SIZE), [posts.length])

  useEffect(() => {
    setListPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const postsPage = useMemo(
    () => posts.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE),
    [posts, listPage],
  )

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
        <header className="dashboard-page-header">
          <span className="dashboard-page-header-accent" aria-hidden="true" />
          <div className="dashboard-page-header-text">
            <h2 className="dashboard-page-title">Gestion du blog</h2>
            <p className="dashboard-page-tagline">Articles et publication</p>
            <p className="dashboard-page-intro blog-tab-intro">
              Rédigez des articles avec texte et image ; les brouillons restent privés jusqu’à publication.
            </p>
          </div>
        </header>

        {error && (
          <div className="blog-tab-error">
            {error}
            <button type="button" onClick={() => setError(null)} aria-label="Fermer">
              ×
            </button>
          </div>
        )}

        <div className="blog-tab-toolbar">
          <Button
            type="button"
            variant="primary"
            className="btn-blog-add"
            onClick={() => {
              setEditingPost(null)
              setFormOpen(true)
            }}
          >
            + Nouvel article
          </Button>
        </div>

        {posts.length === 0 ? (
          <p className="dashboard-empty">Aucun article pour le moment.</p>
        ) : (
          <>
            <ul className="blog-tab-list">
              {postsPage.map((p) => (
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
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="blog-tab-btn-edit"
                        onClick={() => {
                          setEditingPost(p)
                          setFormOpen(true)
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="blog-tab-btn-delete"
                        disabled={actionLoading === p.id}
                        onClick={() => setConfirmDeleteId(p.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              currentPage={listPage}
              totalPages={totalPages}
              onPageChange={setListPage}
              variant="dashboard"
              className="blog-tab-pagination"
              ariaLabel="Pagination des articles"
            />
          </>
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
