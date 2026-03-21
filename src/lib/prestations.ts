import { supabase } from './supabase'
import type { Prestation } from '../types/prestation'

/** Charge toutes les prestations */
export async function loadPrestations(): Promise<Prestation[]> {
  const { data, error } = await supabase
    .from('prestations')
    .select('*')
    .order('ordre', { ascending: true })

  if (error) throw error

  return (data ?? []).map((r) => ({
    id: r.id,
    nom: r.nom ?? '',
    description: r.description ?? '',
    prix: Number(r.prix ?? 0),
    duree: r.duree ?? 0,
    ordre: r.ordre ?? 0,
    createdAt: new Date(r.created_at),
  }))
}

/** Ajoute une prestation */
export async function addPrestation(data: {
  nom: string
  description?: string
  prix: number
  duree: number
}): Promise<Prestation> {
  const { data: row, error } = await supabase
    .from('prestations')
    .insert({
      nom: data.nom.trim(),
      description: data.description?.trim() ?? null,
      prix: data.prix,
      duree: data.duree,
      ordre: 999,
    })
    .select('*')
    .single()

  if (error) throw error

  return {
    id: row.id,
    nom: row.nom ?? '',
    description: row.description ?? '',
    prix: Number(row.prix ?? 0),
    duree: row.duree ?? 0,
    ordre: row.ordre ?? 0,
    createdAt: new Date(row.created_at),
  }
}

/** Modifie une prestation */
export async function updatePrestation(
  id: string,
  data: { nom?: string; description?: string; prix?: number; duree?: number; ordre?: number }
): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (data.nom !== undefined) updates.nom = data.nom.trim()
  if (data.description !== undefined) updates.description = data.description?.trim() || null
  if (data.prix !== undefined) updates.prix = data.prix
  if (data.duree !== undefined) updates.duree = data.duree
  if (data.ordre !== undefined) updates.ordre = data.ordre

  const { error } = await supabase.from('prestations').update(updates).eq('id', id)

  if (error) throw error
}

/** Supprime une prestation */
export async function deletePrestation(id: string): Promise<void> {
  const { error } = await supabase.from('prestations').delete().eq('id', id)

  if (error) throw error
}
