import { supabase } from './supabase'
import type { Client, ClientSeanceNote } from '../types/client'

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
