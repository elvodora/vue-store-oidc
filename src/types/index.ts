/* eslint-disable @typescript-eslint/no-explicit-any */
export * from "./OidcStoreEventListeners"
export * from "./OidcStoreOidcClientSettings"
export * from "./OidcUser"
export * from "./OidcStoreTypes"

export type ObjectIndexType = { [key: string]: any };
export type PayloadType = string | ObjectIndexType;

export const OIDC_BBROWSER_EVENT_PREFIX = "vuestoreoidc";

export interface OidcSigninSilentOptions {
    ignoreErrors?: boolean;
  }
  export interface OidcSigninPopupOptions {
    ignoreErrors?: boolean;
  }
  
  export interface OidcSigninRedirectOptions {
    useReplaceToNavigate?: boolean;
    skipUserInfo?: boolean;
    extraQueryParams?: Record<string, string | number | boolean>;
  }
