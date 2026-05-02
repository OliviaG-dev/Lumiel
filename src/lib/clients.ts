import { supabase } from '@/lib/supabase'
import type { Client, ClientSeanceNote } from '@/types/client'
import { MIN_PHONE_LEN, normalizeEmail, normalizePhone } from '@/lib/clientRendezVousMatch'

const NOTES_AUTO_FICHE =
  'Fiche créée automatiquement suite à une réservation (site ou calendrier).'

export async function loadClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('prenom', { ascending: true })
    .order('nom', { ascending: true })

  if (error) throw error
  return (data ?? []) as Client[]
}

export async function addClient(data: {
  nom: string
  prenom: string
  email: string
  telephone: string
  notes: string
}): Promise<Client> {
  const { data: row, error } = await supabase
    .from('clients')
    .insert({
      nom: data.nom,
      prenom: data.prenom,
      email: data.email.trim(),
      telephone: data.telephone.trim() || null,
      notes: data.notes.trim() || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return row as Client
}

export async function updateClient(
  id: string,
  data: {
    nom: string
    prenom: string
    email: string
    telephone: string
    notes: string
  },
): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({
      nom: data.nom,
      prenom: data.prenom,
      email: data.email.trim(),
      telephone: data.telephone.trim() || null,
      notes: data.notes.trim() || null,
    })
    .eq('id', id)

  if (error) throw error
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

export async function loadSeanceNotes(clientId: string): Promise<ClientSeanceNote[]> {
  const { data, error } = await supabase
    .from('client_seance_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ClientSeanceNote[]
}

export async function addSeanceNote(input: {
  clientId: string
  content: string
  seanceDate: Date | null
}): Promise<ClientSeanceNote> {
  const { data: row, error } = await supabase
    .from('client_seance_notes')
    .insert({
      client_id: input.clientId,
      content: input.content.trim(),
      seance_date: input.seanceDate ? input.seanceDate.toISOString() : null,
    })
    .select('*')
    .single()

  if (error) throw error
  return row as ClientSeanceNote
}

export async function deleteSeanceNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('client_seance_notes').delete().eq('id', noteId)
  if (error) throw error
}

function findMatchingClient(
  clients: Client[],
  emailRaw: string,
  telephoneRaw: string | null | undefined,
): Client | null {
  const emailNorm = normalizeEmail(emailRaw)
  const phoneNorm = normalizePhone(telephoneRaw)
  if (emailNorm) {
    const byEmail = clients.find((c) => normalizeEmail(c.email) === emailNorm)
    if (byEmail) return byEmail
  }
  if (phoneNorm.length >= MIN_PHONE_LEN) {
    const byPhone = clients.find((c) => normalizePhone(c.telephone) === phoneNorm)
    if (byPhone) return byPhone
  }
  return null
}

/**
 * Crée ou met à jour une fiche client à partir des coordonnées d’un rendez-vous.
 * - Correspondance : même e-mail (insensible à la casse) ou même n° de téléphone (chiffres).
 * - Mise à jour : nom, prénom, e-mail, téléphone uniquement ; les notes privées sont conservées.
 * - Sans e-mail ni portable exploitable : aucune action.
 */
export async function upsertClientFromRendezVous(data: {
  nom?: string
  prenom?: string
  email?: string
  telephone?: string | null
}): Promise<void> {
  const nom = (data.nom ?? '').trim()
  const prenom = (data.prenom ?? '').trim()
  const emailNorm = normalizeEmail(data.email ?? '')
  const phoneNorm = normalizePhone(data.telephone)
  const telephoneTrim = (data.telephone ?? '').trim()

  if (!emailNorm && phoneNorm.length < MIN_PHONE_LEN) return

  const { data: rows, error } = await supabase.from('clients').select('*')
  if (error) throw error
  const clients = (rows ?? []) as Client[]
  const existing = findMatchingClient(clients, data.email ?? '', data.telephone)

  if (existing) {
    const emailNext = emailNorm || normalizeEmail(existing.email) || existing.email.trim()
    const telNext = telephoneTrim || (existing.telephone ?? '').trim()
    const notesKept = existing.notes?.trim() ?? ''
    await updateClient(existing.id, {
      nom: nom || existing.nom,
      prenom: prenom || existing.prenom,
      email: emailNext,
      telephone: telNext,
      notes: notesKept,
    })
    return
  }

  if (!emailNorm) return

  await addClient({
    nom: nom || '—',
    prenom: prenom || '—',
    email: emailNorm,
    telephone: telephoneTrim,
    notes: NOTES_AUTO_FICHE,
  })
}
