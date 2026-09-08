/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the CaptionGrab Worker API. Empty = same-origin `/api/*`. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
