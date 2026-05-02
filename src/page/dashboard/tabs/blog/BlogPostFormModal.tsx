import { useState, useEffect, useRef, type FormEvent, type DragEvent } from 'react'
import { createPortal } from 'react-dom'
import type { BlogPost } from '@/types/blogPost'
import { slugifyTitle } from '@/lib/blogPosts'
import { uploadBlogCoverImage } from '@/lib/blogImageUpload'
import { Button } from '@/components/button/Button'
import './BlogPostFormModal.css'

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'

interface BlogPostFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  post: BlogPost | null
  saveFn: (data: {
    slug: string
    title: string
    excerpt: string
    body: string
    imageUrl: string | null
    published: boolean
  }) => Promise<void>
}

export default function BlogPostFormModal({
  isOpen,
  onClose,
  onSaved,
  post,
  saveFn,
}: BlogPostFormModalProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [dropActive, setDropActive] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setTitle(post?.title ?? '')
    setSlug(post?.slug ?? '')
    setExcerpt(post?.excerpt ?? '')
    setBody(post?.body ?? '')
    setImageUrl(post?.imageUrl ?? '')
    setPublished(post?.published ?? false)
    setSlugTouched(Boolean(post))
    setError(null)
    setUploadBusy(false)
    setDropActive(false)
  }, [isOpen, post])

  const handleImageFile = async (file: File) => {
    try {
      setUploadBusy(true)
      setError(null)
      const url = await uploadBlogCoverImage(file)
      setImageUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi de l’image impossible.')
    } finally {
      setUploadBusy(false)
    }
  }

  const onDropZoneDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDropZoneDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropActive(true)
  }

  const onDropZoneDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropActive(false)
  }

  const onDropZoneDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(file.name))) {
      void handleImageFile(file)
    }
  }

  useEffect(() => {
    if (!isOpen || slugTouched || post) return
    setSlug(slugifyTitle(title))
  }, [isOpen, title, slugTouched, post])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const titleTrim = title.trim()
    const slugTrim = slug.trim()
    if (!titleTrim) {
      setError('Le titre est requis.')
      return
    }
    if (!slugTrim) {
      setError('Le slug (URL) est requis.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      await saveFn({
        slug: slugTrim,
        title: titleTrim,
        excerpt: excerpt.trim(),
        body,
        imageUrl: imageUrl.trim() || null,
        published,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const target = document.getElementById('layout-main')
  const content = (
    <div className="blog-post-modal-overlay" onClick={onClose}>
      <div className="blog-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="blog-post-modal-header">
          <h2>{post ? 'Modifier l’article' : 'Nouvel article'}</h2>
          <button type="button" className="blog-post-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <form className="blog-post-modal-body" onSubmit={handleSubmit}>
          {error && <p className="blog-post-modal-error">{error}</p>}
          <div className="blog-post-form-row">
            <label htmlFor="blog-title">Titre *</label>
            <input
              id="blog-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="blog-post-form-row">
            <label htmlFor="blog-slug">Slug (URL) *</label>
            <div className="blog-post-slug-row">
              <input
                id="blog-slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                required
                spellCheck={false}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="blog-post-btn-secondary"
                onClick={() => {
                  setSlug(slugifyTitle(title))
                  setSlugTouched(true)
                }}
              >
                Depuis le titre
              </Button>
            </div>
            <span className="blog-post-hint">Ex. : mon-article-bien-etre → /blog/mon-article-bien-etre</span>
          </div>
          <div className="blog-post-form-row">
            <label htmlFor="blog-excerpt">Chapô / extrait</label>
            <textarea
              id="blog-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Résumé affiché dans la liste du blog…"
            />
          </div>
          <div className="blog-post-form-row">
            <span className="blog-post-label-block" id="blog-image-label">
              Image de couverture
            </span>
            <input
              ref={fileRef}
              type="file"
              id="blog-image-file"
              className="blog-post-file-input"
              accept={IMAGE_ACCEPT}
              aria-labelledby="blog-image-label"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void handleImageFile(file)
              }}
            />
            <div
              className={`blog-post-dropzone${dropActive ? ' blog-post-dropzone--active' : ''}${uploadBusy ? ' blog-post-dropzone--busy' : ''}`}
              onDragEnter={onDropZoneDragEnter}
              onDragOver={onDropZoneDragOver}
              onDragLeave={onDropZoneDragLeave}
              onDrop={onDropZoneDrop}
            >
              {uploadBusy ? (
                <p className="blog-post-dropzone-text">Envoi en cours…</p>
              ) : (
                <>
                  <p className="blog-post-dropzone-text">
                    Glissez-déposez une image ici, ou{' '}
                    <button
                      type="button"
                      className="blog-post-dropzone-browse"
                      onClick={() => fileRef.current?.click()}
                    >
                      parcourir vos fichiers
                    </button>
                  </p>
                  <p className="blog-post-dropzone-sub">JPEG, PNG, GIF ou WebP — max. 5 Mo</p>
                </>
              )}
            </div>
            <div className="blog-post-url-fallback">
              <label htmlFor="blog-image-url">Ou coller une URL</label>
              <input
                id="blog-image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                inputMode="url"
                disabled={uploadBusy}
              />
            </div>
            {imageUrl.trim() ? (
              <div className="blog-post-image-preview-wrap">
                <div className="blog-post-image-preview">
                  <img src={imageUrl.trim()} alt="" decoding="async" onError={(ev) => ((ev.target as HTMLImageElement).style.display = 'none')} />
                </div>
                <button
                  type="button"
                  className="blog-post-remove-image"
                  onClick={() => setImageUrl('')}
                  disabled={uploadBusy}
                >
                  Retirer l’image
                </button>
              </div>
            ) : null}
          </div>
          <div className="blog-post-form-row">
            <label htmlFor="blog-body">Texte de l’article *</label>
            <textarea
              id="blog-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Rédigez le contenu. Laissez une ligne vide entre deux paragraphes."
              required
            />
          </div>
          <div className="blog-post-form-row blog-post-form-row--checkbox">
            <label>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Publié sur le site
            </label>
          </div>
          <div className="blog-post-modal-actions">
            <Button type="button" variant="outline" className="blog-post-btn-secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="blog-post-btn-primary" disabled={saving || uploadBusy}>
              {saving ? 'Enregistrement…' : post ? 'Enregistrer' : 'Créer l’article'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return target ? createPortal(content, target) : content
}
