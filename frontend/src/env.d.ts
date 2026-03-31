/// <reference types="vite/client" />

interface LegacyStorageEntry {
  value: string;
}

interface LegacyStorageApi {
  get(key: string): Promise<LegacyStorageEntry | null>;
}

interface Window {
  storage?: LegacyStorageApi;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
