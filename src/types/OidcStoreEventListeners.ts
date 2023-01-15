import { OidcUser, PayloadType } from "../types";

export type OidcStoreEventListenersKeyType =
  | ((user: OidcUser) => void)
  | (() => void)
  | ((payload?: PayloadType) => void)
  | undefined;

export type OidcStoreErrorEventListenersKey = "oidcError" | "automaticSilentRenewError";

export interface OidcStoreEventListener {
  userLoaded?: (user: OidcUser) => void;
  userUnloaded?: () => void;
  accessTokenExpiring?: () => void;
  accessTokenExpired?: () => void;
  silentRenewError?: () => void;
  userSignedOut?: () => void;
  oidcError?: (payload?: PayloadType) => void;
  automaticSilentRenewError?: (payload?: PayloadType) => void;
  [key: string]: OidcStoreEventListenersKeyType;
}
