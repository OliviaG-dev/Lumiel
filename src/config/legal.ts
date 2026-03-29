/**
 * Identité du responsable du traitement et contact pour l’exercice des droits RGPD.
 * Personnalisez ces valeurs avant la mise en production (ou utilisez des variables VITE_*).
 */
export const LEGAL_CONTROLLER = {
  /** Nom du professionnel ou de la structure */
  name:
    import.meta.env.VITE_RGPD_CONTROLLER_NAME ??
    "Professionnel LUMIEL — à personnaliser (src/config/legal.ts)",
  /** E-mail de contact pour les demandes liées aux données */
  email:
    import.meta.env.VITE_RGPD_CONTACT_EMAIL ?? "contact@example.com",
  /** Adresse du cabinet ou du siège (ville, pays) */
  address:
    import.meta.env.VITE_RGPD_CONTROLLER_ADDRESS ??
    "Adresse à compléter — Code postal, Ville, France",
} as const
