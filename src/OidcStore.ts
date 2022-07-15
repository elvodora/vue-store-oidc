import type { RouteLocationNormalized } from "vue-router";
import { User } from "oidc-client-ts";

// Static Classes
import { OidcHelpers, OidcRouter, PayloadType } from ".";
// StoreOidcClient
import {
  StoreOidcClient,
  StoreOidcClientSettings,
  StoreOidcListeners,
  OidcStoreSettings,
} from ".";
import {
  OidcSigninPopupOptions,
  OidcSigninRedirectOptions,
  OidcSigninSilentOptions,
} from "./StoreOidcClient";

export interface OidcStoreSettings {
  dispatchEventsOnWindow?: boolean;
  isPublicRoute?: (route: RouteLocationNormalized) => boolean;
  publicRoutePaths?: string[];
  routeBase?: string;
  defaultSigninRedirectOptions?: OidcSigninRedirectOptions;
  defaultSigninSilentOptions?: OidcSigninSilentOptions;
  defaultSigninPopupOptions?: OidcSigninPopupOptions;
  isAuthenticatedBy?: "access_token" | "id_token";
}
type OidcStoreStateKeyType =
  | StoreOidcClient
  | OidcStoreSettings
  | User
  | boolean
  | string
  | null;

export interface OidcStoreState {
  storeOidcClient: StoreOidcClient | null;
  oidcStoreSettings: OidcStoreSettings | null;
  user: User | null;
  is_checked: boolean;
  events_are_bound: boolean;
  error: string | null;
  [key: string]: OidcStoreStateKeyType;
}

export interface OidcStoreGetters {
  oidcIsAuthenticated: (state: OidcStoreState) => boolean;
  oidcUser: (state: OidcStoreState) => User | null;
  oidcAccesstoken: (state: OidcStoreState) => string | null;
  oidcAccessTokenExp: (state: OidcStoreState) => number | null;
  oidcScopes: (state: OidcStoreState) => string[] | null;
  oidcIdtoken: (state: OidcStoreState) => string | null;
  oidcIdTokenExp: (state: OidcStoreState) => number | null;
  oidcAuthenticationIsChecked: (state: OidcStoreState) => boolean | null;
  oidcError: (state: OidcStoreState) => string | null;
  oidcIsRoutePublic: (
    state: OidcStoreState
  ) => (route: RouteLocationNormalized) => boolean;
  oidcRefreshtoken: (state: OidcStoreState) => string | null;
  oidcRefreshTokenExp: (state: OidcStoreState) => number | null;
}

export interface OidcStoreActions {
  oidcCheckAccess: (route: RouteLocationNormalized) => Promise<boolean>;
  authenticateOidc: (payload?: PayloadType) => void;
  authenticateOidcSilent: (payload?: PayloadType) => Promise<User | null>;
  authenticateOidcPopup: (payload?: PayloadType) => Promise<void> | undefined;
  oidcSignInCallback: (url?: string) => Promise<string>;
  oidcSignInPopupCallback: (url?: string) => Promise<User | undefined>;
  oidcWasAuthenticated: (user: User | null | undefined) => void;
  getUser: () => Promise<User | null> | undefined;
  addOidcEventListener: (payload: PayloadType) => void;
  removeOidcEventListener: (payload: PayloadType) => void;
  signOutOidc: (payload?: object) => void;
  signOutOidcCallback: () => void;
  signOutPopupOidc: (payload?: object) => void;
  signOutPopupOidcCallback: () => void;
  signOutOidcSilent: (payload?: object) => Promise<void>;
  storeUser: (user: User | null) => void;
  removeOidcUser: () => Promise<void> | undefined;
  removeUser: () => void;
  clearStaleState: () => void;
}
export interface OidcStoreMutations {
  setOidcAuth: (user: User) => void;
  setUser: (user: User) => void;
  unsetOidcAuth: () => void;
  setOidcAuthIsChecked: () => void;
  setOidcEventsAreBound: () => void;
  setOidcError: (err: PayloadType) => void;
}

export interface OidcStoreActionsMutations
  extends OidcStoreActions,
    OidcStoreMutations {}

export interface OidcStoreMembers
  extends OidcStoreState,
    OidcStoreGetters,
    OidcStoreActions,
    OidcStoreMutations {}

export abstract class OidcStore {
  protected _state: OidcStoreState = {
    storeOidcClient: null,
    oidcStoreSettings: null,
    user: null,
    is_checked: false,
    events_are_bound: false,
    error: null,
  };
  protected _getters: OidcStoreGetters = {
    oidcIsAuthenticated: (state: OidcStoreState) => {
      if (
        (state.oidcStoreSettings.isAuthenticatedBy || "id_token") ===
        "id_token"
      )
      return state.user?.id_token ? true : false;
      else return state.user?.access_token ? true : false;
    },
    oidcUser: (state: OidcStoreState) => {
      return state?.user;
    },
    oidcAccesstoken: (state: OidcStoreState) => {
      return state.user?.access_token
        ? OidcHelpers.TokenIsExpired(state.User.access_token)
          ? null
          : state.access_token
        : null;
    },
    oidcAccessTokenExp: (state: OidcStoreState) => {
      return OidcHelpers.TokenExp(state.user?.access_token || "");
    },
    oidcScopes: (state: OidcStoreState) => {
      if (state.user && state.user.scope) return state.user.scope.split(",");
      return [];
    },
    oidcIdtoken: (state: OidcStoreState) => {
      return OidcHelpers.TokenIsExpired(state.user?.id_token || "")
        ? null
        : state.user?.id_token || null;
    },
    oidcIdTokenExp: (state: OidcStoreState) => {
      return OidcHelpers.TokenExp(state.user?.id_token || "");
    },
    oidcRefreshtoken: (state: OidcStoreState) => {
      return OidcHelpers.TokenIsExpired(state.user?.refresh_token || "")
        ? null
        : state.user?.refresh_token || null;
    },
    oidcRefreshTokenExp: (state: OidcStoreState) => {
      return OidcHelpers.TokenExp(state.user?.refresh_token || "");
    },
    oidcAuthenticationIsChecked: (state: OidcStoreState) => {
      return state.is_checked;
    },
    oidcError: (state: OidcStoreState) => {
      return state.error;
    },
    oidcIsRoutePublic: (state: OidcStoreState) => {
      return (route: RouteLocationNormalized) => {
        return OidcRouter.IsRoutePublic(
          route,
          state.oidcStoreSettings.publicRoutePaths,
          state.oidcStoreSettings.isPublicRoute
        );
      };
    },
  };

  constructor(
    storeOidcClientSettings: StoreOidcClientSettings,
    storeSettings?: OidcStoreSettings,
    oidcEventListeners?: StoreOidcListeners
  ) {
    this._state.oidcStoreSettings = storeSettings ? storeSettings : {};
    // default authentication is set to id_token
    this._state.oidcStoreSettings.isAuthenticatedBy =
      storeSettings?.isAuthenticatedBy
        ? storeSettings.isAuthenticatedBy
        : "id_token"; // default authentication is set to id_token
    this._state.oidcStoreSettings.isAuthenticatedBy =
      storeSettings?.isAuthenticatedBy
        ? storeSettings.isAuthenticatedBy
        : "id_token";
    this._state.storeOidcClient = new StoreOidcClient(
      storeOidcClientSettings,
      oidcEventListeners
    );
  }
  get State() {
    return this._state;
  }
  get Getters() {
    return this._getters;
  }
  abstract get Actions(): OidcStoreActions;
  abstract get Mutations(): OidcStoreMutations;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract CreateStore(): any;
}
