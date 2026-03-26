import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadPublishedBlogPostBySlug } from '../../lib/blogPosts'
import type { BlogPost } from '../../types/blogPost'
import './BlogPage.css'

function ArticleBody({ body }: { body: string }) {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (paragraphs.length === 0) {
    return <p className="blog-article-empty">Contenu à venir.</p>
  }
  return (
    <div className="blog-article-text">
      {paragraphs.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  )
}

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setPost(null)
      return
    }
    let cancelled = false
    setPost(undefined)
    setError(null)
    loadPublishedBlogPostBySlug(slug)
      .then((p) => {
        if (!cancelled) setPost(p)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur de chargement')
          setPost(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (post === undefined && !error) {
    return (
      <div className="blog-page">
        <p className="blog-loading">Chargement…</p>
      </div>
    )
  }

  if (error || post === null || post === undefined) {
    return (
      <div className="blog-page">
        <section className="blog-content blog-content--article">
          <h1>Article introuvable</h1>
          <p className="blog-missing">
            {error ?? 'Cet article n’existe pas ou n’est plus publié.'}
          </p>
          <Link to="/blog" className="blog-back-link">
            ← Retour au blog
          </Link>
        </section>
      </div>
    )
  }

  const dateLabel = post.updatedAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="blog-page">
      <article className="blog-article">
        <header className="blog-article-header">
          <Link to="/blog" className="blog-back-link">
            ← Tous les articles
          </Link>
          <time className="blog-article-date" dateTime={post.updatedAt.toISOString()}>
            {dateLabel}
          </time>
          <h1>{post.title}</h1>
          {post.excerpt ? <p className="blog-article-lead">{post.excerpt}</p> : null}
        </header>
        {post.imageUrl ? (
          <div className="blog-article-cover-wrap">
            <img
              className="blog-article-cover"
              src={post.imageUrl}
              alt=""
              decoding="async"
            />
          </div>
        ) : null}
        <ArticleBody body={post.body} />
      </article>
    </div>
  )
}
