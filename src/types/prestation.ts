export interface Prestation {
  id: string
  nom: string
  description: string
  prix: number
  duree: number
  /** Code hex parmi la palette Lumiel (9 couleurs) */
  couleur: string
  ordre: number
  createdAt: Date
}
