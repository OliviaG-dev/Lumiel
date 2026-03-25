export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  imageUrl: string | null
  published: boolean
  createdAt: Date
  updatedAt: Date
}
