interface ImportMetaEnv {
  /** Optional endpoint for the quote form (see .env.example). */
  readonly PUBLIC_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
