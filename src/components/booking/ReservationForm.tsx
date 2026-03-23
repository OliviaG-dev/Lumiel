import type { Reservation } from "../../types/reservation";

const PRESTATIONS_FALLBACK = [
  "Massage bien-être",
  "Reiki",
  "Soin énergétique",
  "Consultation",
  "Autre",
];

const DUREE_OPTIONS = [30, 45, 60, 90, 120];

export interface ReservationFormData {
  prestation: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  duree: number;
  resume: string;
}

interface ReservationFormProps {
  data: ReservationFormData;
  onChange: (data: ReservationFormData) => void;
  submitLabel?: string;
  onCancel?: () => void;
  disabled?: boolean;
  prestations?: string[];
  /** Masque le champ prestation (utilisé quand la prestation est choisie à une étape précédente) */
  hidePrestation?: boolean;
  /** Masque le sélecteur de durée (réservation client : durée = celle de la prestation) */
  hideDuree?: boolean;
}

export function getDefaultFormData(prestations?: string[]): ReservationFormData {
  const list = prestations?.length ? prestations : PRESTATIONS_FALLBACK;
  return {
    prestation: list[0],
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    duree: 60,
    resume: "",
  };
}

export const defaultFormData: ReservationFormData = getDefaultFormData();

export function getFormDataFromReservation(
  r: Reservation,
  prestations?: string[],
): ReservationFormData {
  const list = prestations?.length ? prestations : PRESTATIONS_FALLBACK;
  return {
    prestation: r.prestation ?? list[0],
    nom: r.nom ?? "",
    prenom: r.prenom ?? "",
    email: r.email ?? "",
    telephone: r.telephone ?? "",
    duree: r.duree ?? 60,
    resume: r.resume ?? "",
  };
}

export default function ReservationForm({
  data,
  onChange,
  submitLabel = "Valider",
  onCancel,
  disabled = false,
  prestations = PRESTATIONS_FALLBACK,
  hidePrestation = false,
  hideDuree = false,
}: ReservationFormProps) {
  const update = (field: keyof ReservationFormData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="reservation-form">
      {!hidePrestation && (
        <div className="reservation-form-row">
          <label>Prestation</label>
          <select
            value={data.prestation}
            onChange={(e) => update("prestation", e.target.value)}
            required
          >
            {prestations.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="reservation-form-grid">
        <div className="reservation-form-row">
          <label>Nom</label>
          <input
            type="text"
            value={data.nom}
            onChange={(e) => update("nom", e.target.value)}
            placeholder="Dupont"
            required
          />
        </div>
        <div className="reservation-form-row">
          <label>Prénom</label>
          <input
            type="text"
            value={data.prenom}
            onChange={(e) => update("prenom", e.target.value)}
            placeholder="Marie"
            required
          />
        </div>
      </div>
      <div className="reservation-form-row">
        <label>Email</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="marie.dupont@email.com"
          required
        />
      </div>
      <div className="reservation-form-row">
        <label>Téléphone</label>
        <input
          type="tel"
          value={data.telephone}
          onChange={(e) => update("telephone", e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>
      {!hideDuree && (
        <div className="reservation-form-row">
          <label>Durée (minutes)</label>
          <select
            value={data.duree}
            onChange={(e) => update("duree", Number(e.target.value))}
          >
            {DUREE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="reservation-form-row">
        <label>Résumé / Commentaires du client</label>
        <textarea
          value={data.resume}
          onChange={(e) => update("resume", e.target.value)}
          placeholder="Demandes particulières, motif de consultation..."
          rows={2}
        />
      </div>
      <div className="reservation-form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn-booking-secondary"
            onClick={onCancel}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          className="btn-booking-primary"
          disabled={disabled}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
