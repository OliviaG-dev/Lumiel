import { supabase } from './supabase'
import type { Avis } from '../types/avis'

/** Charge tous les avis (pour le dashboard admin) */
export async function loadAvis(): Promise<Avis[]> {
  const { data, error } = await supabase
    .from('avis')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((r) => ({
    id: r.id,
    prenom: r.prenom ?? '',
    nom: r.nom ?? '',
    note: r.note ?? 0,
    typeSeance: r.type_seance ?? '',
    avis: r.avis ?? '',
    valide: r.valide ?? false,
    createdAt: new Date(r.created_at),
  }))
}

/** Charge uniquement les avis validés (pour la page Témoignages) */
export async function loadAvisValidés(): Promise<Avis[]> {
  const { data, error } = await supabase
    .from('avis')
    .select('*')
    .eq('valide', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((r) => ({
    id: r.id,
    prenom: r.prenom ?? '',
    nom: r.nom ?? '',
    note: r.note ?? 0,
    typeSeance: r.type_seance ?? '',
    avis: r.avis ?? '',
    valide: r.valide ?? false,
    createdAt: new Date(r.created_at),
  }))
}

/** Ajoute un avis (soumission côté client) */
export async function addAvis(data: {
  prenom: string
  nom: string
  note: number
  typeSeance: string
  avis: string
}): Promise<Avis> {
  const { data: row, error } = await supabase
    .from('avis')
    .insert({
      prenom: data.prenom,
      nom: data.nom,
      note: data.note,
      type_seance: data.typeSeance,
      avis: data.avis,
      valide: false,
    })
    .select('*')
    .single()

  if (error) throw error

  return {
    id: row.id,
    prenom: row.prenom ?? '',
    nom: row.nom ?? '',
    note: row.note ?? 0,
    typeSeance: row.type_seance ?? '',
    avis: row.avis ?? '',
    valide: row.valide ?? false,
    createdAt: new Date(row.created_at),
  }
}

/** Valide un avis */
export async function validateAvis(id: string): Promise<void> {
  const { error } = await supabase
    .from('avis')
    .update({ valide: true })
    .eq('id', id)

  if (error) throw error
}

/** Invalide un avis (retire de la publication) */
export async function invalidateAvis(id: string): Promise<void> {
  const { error } = await supabase
    .from('avis')
    .update({ valide: false })
    .eq('id', id)

  if (error) throw error
}

/** Supprime un avis */
export async function deleteAvis(id: string): Promise<void> {
  const { error } = await supabase.from('avis').delete().eq('id', id)

  if (error) throw error
}
