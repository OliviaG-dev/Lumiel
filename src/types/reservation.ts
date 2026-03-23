export interface Reservation {
  id: string
  type: 'disponibilité' | 'rendez-vous'
  start: Date
  end: Date
  prestation?: string
  /** Rendez-vous uniquement */
  nom?: string
  prenom?: string
  email?: string
  telephone?: string
  duree?: number
  resume?: string
}

export interface ReservationStorage {
  id: string
  type: 'disponibilité' | 'rendez-vous'
  start: string
  end: string
  prestation?: string
  nom?: string
  prenom?: string
  email?: string
  telephone?: string
  duree?: number
  resume?: string
}

export function toStorage(r: Reservation): ReservationStorage {
  return {
    ...r,
    start: r.start.toISOString(),
    end: r.end.toISOString(),
  }
}

export function fromStorage(s: ReservationStorage): Reservation {
  return {
    ...s,
    start: new Date(s.start),
    end: new Date(s.end),
  }
}
