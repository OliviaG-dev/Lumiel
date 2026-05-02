import { supabase } from '@/lib/supabase'
import type { BlogPost } from '@/types/blogPost'

function mapRow(r: Record<string, unknown>): BlogPost {
  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? ''),
    body: String(r.body ?? ''),
    imageUrl: r.image_url ? String(r.image_url) : null,
    published: Boolean(r.published),
    createdAt: new Date(String(r.created_at)),
    updatedAt: new Date(String(r.updated_at)),
  }
}

/** Génère un identifiant d’URL à partir du titre (sans accents, minuscules, tirets). */
export function slugifyTitle(title: string): string {
  const s = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'article'
}

/** Tous les articles (dashboard admin, utilisateur authentifié). */
export async function loadBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
}

/** Articles publiés uniquement (site public). */
export async function loadPublishedBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
}

/** Détail public par slug (publié uniquement). */
export async function loadPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function addBlogPost(data: {
  slug: string
  title: string
  excerpt: string
  body: string
  imageUrl: string | null
  published: boolean
}): Promise<BlogPost> {
  const { data: row, error } = await supabase
    .from('blog_posts')
    .insert({
      slug: data.slug.trim(),
      title: data.title.trim(),
      excerpt: data.excerpt.trim() || null,
      body: data.body,
      image_url: data.imageUrl?.trim() || null,
      published: data.published,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapRow(row as Record<string, unknown>)
}

export async function updateBlogPost(
  id: string,
  data: {
    slug?: string
    title?: string
    excerpt?: string
    body?: string
    imageUrl?: string | null
    published?: boolean
  },
): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (data.slug !== undefined) updates.slug = data.slug.trim()
  if (data.title !== undefined) updates.title = data.title.trim()
  if (data.excerpt !== undefined) updates.excerpt = data.excerpt.trim() || null
  if (data.body !== undefined) updates.body = data.body
  if (data.imageUrl !== undefined) updates.image_url = data.imageUrl?.trim() || null
  if (data.published !== undefined) updates.published = data.published

  const { error } = await supabase.from('blog_posts').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw error
}
