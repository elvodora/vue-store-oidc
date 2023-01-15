import {
  OidcSigninPopupOptions,
  OidcSigninRedirectOptions,
  OidcSigninSilentOptions,
  OidcStoreErrorEventListenersKey,
  OidcStoreEventListener,
  OidcStoreOidcClientSettings,
  OidcUser,
  PayloadType,
} from "../types";
import { RouteLocationNormalized } from "vue-router";
import { OidcStoreOidcClient } from "../stores";

export interface OidcStoreSettings {
  /**
   * If you want to listen to the events from inside your application,
   * the events can also be dispatched in the browser as custom events by vue-store-oidc (prefixed with {@link OIDC_BBROWSER_EVENT_PREFIX}:).
   * If you want this, you can pass dispatchEventsOnWindow: true as a storeSetting.
   */
  dispatchEventsOnWindow?: boolean;
  /**
   * Routes with meta.isPublic will not require authentication.
   * If there are other parameters that you want to consider when deciding if a route is public,
   * you can also provide a function that takes the route as an argument when you create your store:
   * ```ts
   * const oidcStore = new PiniaOidcStore(
   *  oidcSettings,
   *  {
   *    dispatchEventsOnWindow: true,
   *    isPublicRoute: (route) => route.name && route.name.startsWith('public') }
   *  }
   * )
   * ```
   * @param route
   * @returns true if route is public
   */
  isPublicRoute?: (route: RouteLocationNormalized) => boolean;
  /**
   * If you want to have some of your routes public, you can specify those as publicRoutePaths in the storeSetting argument:
   * ```ts
   * const oidcStore = new PiniaOidcStore(
   *  oidcSettings,
   *  {
   *    dispatchEventsOnWindow: true,
   *    publicRoutePaths: ['/', '/about-us']
   *  }
   * )
   * ```
   */
  publicRoutePaths?: string[];
  /**
   * If you use vue-router with a router base other than the default (/),
   * you will want to pass your route as routeBase in the storeSetting argument:
   * ```ts
   * const oidcStore = new PiniaOidcStore(
   *  oidcSettings,
   *  {
   *    dispatchEventsOnWindow: true,
   *    routeBase: '/app'
   *  }
   * )
   * ```
   */
  routeBase?: string;
  defaultSigninRedirectOptions?: OidcSigninRedirectOptions;
  defaultSigninSilentOptions?: OidcSigninSilentOptions;
  defaultSigninPopupOptions?: OidcSigninPopupOptions;
  /** By default this package binds access to if the user has a valid id_token.
   * You can change this with the isAuthenticatedBy property on the storeSetting argument
   * so access is bound to a valid access_token in stead:
   * ```ts
   * const oidcStore = new PiniaOidcStore(
   *  oidcSettings,
   *  {
   *    dispatchEventsOnWindow: true,
   *    isAuthenticatedBy: 'access_token'
   *  }
   * )
   * ```
   * */
  isAuthenticatedBy?: "access_token" | "id_token";
}

type OidcStoreStateKeyType =
  | OidcStoreOidcClient
  | OidcStoreOidcClientSettings
  | OidcStoreSettings
  | OidcStoreEventListener
  | OidcUser
  | boolean
  | string
  | null;

export interface OidcStoreState {
  storeOidcClient: OidcStoreOidcClient | null;
  storeOidcClientSettings: OidcStoreOidcClientSettings | null;
  storeSettings: OidcStoreSettings | null;
  storeEventListeners: OidcStoreEventListener | null;
  user: OidcUser | null;
  isChecked: boolean;
  eventsAreBound: boolean;
  error: string | null;
}
export interface OidcStoreStateKey extends OidcStoreState {
  [key: string]: OidcStoreStateKeyType;
}

export interface OidcStoreGetters {
  oidcIsAuthenticated: (state: OidcStoreState) => boolean;
  oidcUser: (state: OidcStoreState) => OidcUser | null;
  oidcAccessToken: (state: OidcStoreState) => string | null;
  oidcAccessTokenExpired: (state: OidcStoreState) => number | null;
  oidcScopes: (state: OidcStoreState) => string[] | null;
  oidcIdToken: (state: OidcStoreState) => string | null;
  oidcIdTokenExpired: (state: OidcStoreState) => number | null;
  oidcAuthenticationIsChecked: (state: OidcStoreState) => boolean | null;
  oidcError: (state: OidcStoreState) => string | null;
  oidcIsRoutePublic: (
    state: OidcStoreState
  ) => (route: RouteLocationNormalized) => boolean;
  oidcRefreshToken: (state: OidcStoreState) => string | null;
  oidcRefreshTokenExpired: (state: OidcStoreState) => number | null;
}

export interface OidcStoreActions {
  oidcCheckAccess: (route: RouteLocationNormalized) => Promise<boolean>;
  authenticateOidc: (payload?: PayloadType) => void;
  authenticateOidcSilent: (payload?: PayloadType) => Promise<OidcUser | null>;
  authenticateOidcPopup: (payload?: PayloadType) => Promise<void>;
  oidcSignInCallback: (url?: string) => Promise<string>;
  oidcSignInPopupCallback: (url?: string) => Promise<OidcUser>;
  oidcWasAuthenticated: (user: OidcUser | null) => void;
  addOidcEventListener: (payload: PayloadType) => void;
  removeOidcEventListener: (payload: PayloadType) => void;
  signOutOidc: (payload?: object) => void;
  signOutOidcCallback: () => void;
  signOutPopupOidc: (payload?: object) => void;
  signOutPopupOidcCallback: () => void;
  signOutOidcSilent: (payload?: object) => Promise<void>;
  getUser: () => Promise<OidcUser | null>;
  storeUser: (user: OidcUser | null) => void;
  removeUser: () => Promise<void>;
  clearStaleState: () => void;
  dispatchCustomErrorEvent: (
    eventName: OidcStoreErrorEventListenersKey,
    payload: PayloadType
  ) => void;
}
export interface OidcStoreMutations {
  setOidcAuth: (user: OidcUser | null) => void;
  setUser: (user: OidcUser | null) => void;
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
