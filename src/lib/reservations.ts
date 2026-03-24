import { addDays, addMinutes, startOfDay } from "date-fns";
import { supabase } from "./supabase";
import type { Reservation } from "../types/reservation";

/**
 * Supprime les disponibilités dont le début est strictement avant aujourd’hui (minuit, heure locale).
 * Appelée automatiquement au chargement des réservations.
 */
export async function deletePastDisponibilites(): Promise<void> {
  const todayStart = startOfDay(new Date());
  const { error } = await supabase
    .from("disponibilites")
    .delete()
    .lt("start", todayStart.toISOString());

  if (error) throw error;
}

/** Charge les disponibilités et rendez-vous depuis Supabase et les fusionne */
export async function loadReservations(): Promise<Reservation[]> {
  await deletePastDisponibilites();

  const [dispoRes, rdvRes] = await Promise.all([
    supabase
      .from("disponibilites")
      .select("*")
      .order("start", { ascending: true }),
    supabase
      .from("rendez_vous")
      .select("*")
      .order("start", { ascending: true }),
  ]);

  if (dispoRes.error) throw dispoRes.error;
  if (rdvRes.error) throw rdvRes.error;

  const dispos: Reservation[] = (dispoRes.data ?? []).map((r) => ({
    id: r.id,
    type: "disponibilité" as const,
    start: new Date(r.start),
    end: new Date(r.end),
    prestation: r.prestation ?? undefined,
  }));

  const rdvs: Reservation[] = (rdvRes.data ?? []).map((r) => ({
    id: r.id,
    type: "rendez-vous" as const,
    start: new Date(r.start),
    end: new Date(r.end),
    prestation: r.prestation,
    nom: r.nom,
    prenom: r.prenom,
    email: r.email,
    telephone: r.telephone ?? undefined,
    duree: r.duree,
    resume: r.resume ?? undefined,
  }));

  return [...dispos, ...rdvs].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}

/** Ajoute une disponibilité */
export async function addDisponibilite(data: {
  start: Date;
  end: Date;
  prestation?: string;
}): Promise<Reservation> {
  const { data: row, error } = await supabase
    .from("disponibilites")
    .insert({
      start: data.start.toISOString(),
      end: data.end.toISOString(),
      prestation: data.prestation ?? "Toute prestation",
    })
    .select("*")
    .single();

  if (error) throw error;

  return {
    id: row.id,
    type: "disponibilité",
    start: new Date(row.start),
    end: new Date(row.end),
    prestation: row.prestation ?? undefined,
  };
}

/** Ajoute un rendez-vous */
export async function addRendezVous(
  data: Omit<Reservation, "id" | "type">,
): Promise<Reservation> {
  const { data: row, error } = await supabase
    .from("rendez_vous")
    .insert({
      start: data.start.toISOString(),
      end: data.end.toISOString(),
      prestation: data.prestation ?? "",
      nom: data.nom ?? "",
      prenom: data.prenom ?? "",
      email: data.email ?? "",
      telephone: data.telephone ?? null,
      duree: data.duree ?? 60,
      resume: data.resume ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;

  return {
    id: row.id,
    type: "rendez-vous",
    start: new Date(row.start),
    end: new Date(row.end),
    prestation: row.prestation,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    telephone: row.telephone ?? undefined,
    duree: row.duree,
    resume: row.resume ?? undefined,
  };
}

/** Met à jour un rendez-vous */
export async function updateRendezVous(data: Reservation): Promise<void> {
  const { error } = await supabase
    .from("rendez_vous")
    .update({
      start: data.start.toISOString(),
      end: data.end.toISOString(),
      prestation: data.prestation ?? "",
      nom: data.nom ?? "",
      prenom: data.prenom ?? "",
      email: data.email ?? "",
      telephone: data.telephone ?? null,
      duree: data.duree ?? 60,
      resume: data.resume ?? null,
    })
    .eq("id", data.id);

  if (error) throw error;
}

/** Supprime une disponibilité ou un rendez-vous */
export async function deleteReservation(
  id: string,
  type: "disponibilité" | "rendez-vous",
): Promise<void> {
  const table = type === "disponibilité" ? "disponibilites" : "rendez_vous";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

/** Ajoute plusieurs disponibilités en une fois */
export async function addDisponibilitesBatch(
  items: { start: Date; end: Date; prestation?: string }[],
): Promise<Reservation[]> {
  const rows = items.map((it) => ({
    start: it.start.toISOString(),
    end: it.end.toISOString(),
    prestation: it.prestation ?? "Toute prestation",
  }));

  const { data, error } = await supabase
    .from("disponibilites")
    .insert(rows)
    .select("*");
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    type: "disponibilité" as const,
    start: new Date(r.start),
    end: new Date(r.end),
    prestation: r.prestation ?? undefined,
  }));
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

/** Découpe un créneau libre en sous-créneaux de durationMinutes */
function splitSlotByDuration(
  slotStart: Date,
  slotEnd: Date,
  durationMinutes: number,
): { start: Date; end: Date }[] {
  const result: { start: Date; end: Date }[] = [];
  let current = new Date(slotStart);
  const endTime = slotEnd.getTime();
  const durationMs = durationMinutes * 60 * 1000;

  while (current.getTime() + durationMs <= endTime) {
    result.push({
      start: new Date(current),
      end: addMinutes(current, durationMinutes),
    });
    current = addMinutes(current, durationMinutes);
  }
  return result;
}

/**
 * Créneaux disponibles = disponibilités moins les rendez-vous.
 * Si durationMinutes est fourni, découpe les créneaux libres en tranches de cette durée.
 */
export function getAvailableSlots(
  date: Date,
  reservations: Reservation[],
  durationMinutes: number = 60,
): { start: Date; end: Date }[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dispoDuJour = reservations.filter(
    (r) =>
      r.type === "disponibilité" && overlaps(r.start, r.end, dayStart, dayEnd),
  );

  const rdvDuJour = reservations.filter(
    (r) =>
      r.type === "rendez-vous" && overlaps(r.start, r.end, dayStart, dayEnd),
  );

  const rawSlots: { start: Date; end: Date }[] = [];

  for (const d of dispoDuJour) {
    const dStart = d.start > dayStart ? d.start : new Date(dayStart);
    const dEnd = d.end < dayEnd ? d.end : new Date(dayEnd);
    let currentStart = new Date(dStart);

    const rdvInDispo = rdvDuJour
      .filter((r) => r.start < dEnd && r.end > dStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    for (const r of rdvInDispo) {
      if (currentStart < r.start) {
        rawSlots.push({
          start: new Date(currentStart),
          end: new Date(r.start),
        });
      }
      currentStart = new Date(
        Math.max(currentStart.getTime(), r.end.getTime()),
      );
    }
    if (currentStart < dEnd) {
      rawSlots.push({ start: currentStart, end: new Date(dEnd) });
    }
  }

  const sorted = rawSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

  const slots: { start: Date; end: Date }[] = [];
  for (const slot of sorted) {
    const subSlots = splitSlotByDuration(slot.start, slot.end, durationMinutes);
    slots.push(...subSlots);
  }

  return slots;
}

/** Dates ayant au moins un créneau disponible pour la durée donnée */
export function getDatesWithAvailability(
  reservations: Reservation[],
  fromDate: Date,
  durationMinutes: number = 60,
  daysAhead: number = 60,
): Date[] {
  const dates: Date[] = [];
  const start = startOfDay(fromDate);

  for (let i = 0; i < daysAhead; i++) {
    const d = addDays(start, i);
    const slotList = getAvailableSlots(d, reservations, durationMinutes);
    if (slotList.length > 0) {
      dates.push(d);
    }
  }

  return dates;
}
