export interface Client {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientSeanceNote {
  id: string
  client_id: string
  content: string
  seance_date: string | null
  created_at: string
}
