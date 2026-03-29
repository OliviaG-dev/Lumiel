import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination, { getTotalPages } from '../../components/pagination/Pagination'
import { loadPublishedBlogPosts } from '../../lib/blogPosts'
import type { BlogPost } from '../../types/blogPost'
import './BlogPage.css'

const PAGE_SIZE = 4

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const totalPages = useMemo(() => getTotalPages(posts.length, PAGE_SIZE), [posts.length])

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const postsPage = useMemo(
    () => posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [posts, page],
  )

  useEffect(() => {
    let cancelled = false
    loadPublishedBlogPosts()
      .then((data) => {
        if (!cancelled) setPosts(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <h1>Blog bien-être</h1>
        <p className="blog-hero-intro">
          Conseils et contenus autour du bien-être énergétique pour nourrir votre chemin vers
          l’harmonie intérieure.
        </p>
      </section>

      {loading && <p className="blog-loading">Chargement des articles…</p>}
      {error && (
        <div className="blog-list-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <p className="blog-empty">Les prochains articles seront publiés ici.</p>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <ul className="blog-grid">
            {postsPage.map((p) => (
              <li key={p.id} className="blog-card">
                <Link to={`/blog/${encodeURIComponent(p.slug)}`} className="blog-card-link">
                  <div className="blog-card-visual">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="blog-card-img" decoding="async" />
                    ) : (
                      <div className="blog-card-img blog-card-img--placeholder" aria-hidden />
                    )}
                  </div>
                  <div className="blog-card-body">
                    <time className="blog-card-date" dateTime={p.updatedAt.toISOString()}>
                      {p.updatedAt.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                    <h2 className="blog-card-title">{p.title}</h2>
                    {p.excerpt ? <p className="blog-card-excerpt">{p.excerpt}</p> : null}
                    <span className="blog-card-cta">Lire l’article</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="blog-pagination"
            ariaLabel="Pagination des articles"
          />
        </>
      )}
    </div>
  )
}
