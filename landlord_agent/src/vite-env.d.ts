/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_CLIENT_ID: string;
  readonly VITE_AZURE_AUTHORITY: string;
  readonly VITE_AZURE_REDIRECT_URI: string;
  readonly VITE_AZURE_POST_LOGOUT_REDIRECT_URI: string;
  readonly VITE_AZURE_CLIENT_ID_PROD: string;
  readonly VITE_AZURE_AUTHORITY_PROD: string;
  readonly VITE_AZURE_REDIRECT_URI_PROD: string;
  readonly VITE_AZURE_CLIENT_ID_DEV: string;
  readonly VITE_AZURE_AUTHORITY_DEV: string;
  readonly VITE_AZURE_REDIRECT_URI_DEV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
