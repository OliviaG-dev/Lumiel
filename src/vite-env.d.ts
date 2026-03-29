/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RGPD_CONTROLLER_NAME?: string
  readonly VITE_RGPD_CONTACT_EMAIL?: string
  readonly VITE_RGPD_CONTROLLER_ADDRESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
