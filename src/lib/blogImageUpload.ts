import { supabase } from '@/lib/supabase'

const BUCKET = 'blog-images'
const MAX_BYTES = 5 * 1024 * 1024

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

function extensionForFile(file: File): string | null {
  const fromMime = MIME_EXT[file.type]
  if (fromMime) return fromMime
  const m = /\.(jpe?g|png|gif|webp)$/i.exec(file.name)
  if (!m) return null
  const raw = m[1].toLowerCase()
  if (raw === 'jpeg' || raw === 'jpg') return 'jpg'
  if (raw === 'png' || raw === 'gif' || raw === 'webp') return raw
  return null
}

function contentTypeForFile(file: File, ext: string): string {
  if (file.type && MIME_EXT[file.type]) return file.type
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  return `image/${ext}`
}

/** Envoie une image de couverture dans le bucket `blog-images` et renvoie l’URL publique. */
export async function uploadBlogCoverImage(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error(`Fichier trop volumineux (max. ${MAX_BYTES / (1024 * 1024)} Mo).`)
  }
  const ext = extensionForFile(file)
  if (!ext) {
    throw new Error('Format non supporté (JPEG, PNG, GIF ou WebP).')
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Vous devez être connecté pour envoyer une image.')
  }

  const key = `covers/${userData.user.id}/${crypto.randomUUID()}.${ext}`
  const { error: upError } = await supabase.storage.from(BUCKET).upload(key, file, {
    cacheControl: '86400',
    upsert: false,
    contentType: contentTypeForFile(file, ext),
  })

  if (upError) {
    throw new Error(upError.message || 'Échec de l’envoi de l’image.')
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key)
  const url = data?.publicUrl
  if (!url) throw new Error('URL publique indisponible.')
  return url
}
