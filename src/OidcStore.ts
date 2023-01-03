import type { RouteLocationNormalized } from "vue-router";

//OidcUser
import { OidcUser } from ".";
//OidcUtils
import { OidcUtils } from ".";
// OidcStoreOidcClient
import { OidcStoreOidcClient } from ".";
// OidcStoreOidcClientSettings
import { OidcStoreOidcClientSettings } from ".";
//OidcStoreEventListener
import { OidcStoreErrorEventListenersKey, OidcStoreEventListener } from ".";

// Static Classes
import { OidcRouter, PayloadType } from ".";

const _tokenExpiration = (token: string) => {
  const parsed = OidcUtils.ParseJwt(token);
  return parsed?.exp ? parsed.exp * 1000 : 0;
};
const _tokenIsExpired = (token: string) => {
  const tokenExpiryTime = _tokenExpiration(token)
  return tokenExpiryTime ? tokenExpiryTime < new Date().getTime() : false;
};

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
  authenticateOidcSilent: (
    payload?: PayloadType
  ) => Promise<OidcUser | null>;
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

export abstract class OidcStore {
  protected _state: OidcStoreState = {
    storeOidcClient: null,
    storeOidcClientSettings: null,
    storeEventListeners: null,
    storeSettings: null,
    user: null,
    isChecked: false,
    eventsAreBound: false,
    error: null,
  };
  protected _getters: OidcStoreGetters = {
    oidcIsAuthenticated: (state: OidcStoreState) => {
      if ((state.storeSettings?.isAuthenticatedBy || "id_token") === "id_token")
        return state.user?.id_token ? true : false;
      else return state.user?.access_token ? true : false;
    },
    oidcUser: (state: OidcStoreState) => {
      return state.user;
    },
    oidcAccessToken: (state: OidcStoreState) => {
      return state.user?.access_token
        ? _tokenIsExpired(state.user.access_token)
          ? null
          : state.user.access_token
        : null;
    },
    oidcAccessTokenExpired: (state: OidcStoreState) => {
      return _tokenExpiration(state.user?.access_token || "");
    },
    oidcScopes: (state: OidcStoreState) => {
      if (state.user && state.user.scope) return state.user.scope.split(",");
      return [];
    },
    oidcIdToken: (state: OidcStoreState) => {
      return _tokenIsExpired(state.user?.id_token || "")
        ? null
        : state.user?.id_token || null;
    },
    oidcIdTokenExpired: (state: OidcStoreState) => {
      return _tokenExpiration(state.user?.id_token || "");
    },
    oidcRefreshToken: (state: OidcStoreState) => {
      return _tokenIsExpired(state.user?.refresh_token || "")
        ? null
        : state.user?.refresh_token || null;
    },
    oidcRefreshTokenExpired: (state: OidcStoreState) => {
      return _tokenExpiration(state.user?.refresh_token || "");
    },
    oidcAuthenticationIsChecked: (state: OidcStoreState) => {
      return state.isChecked;
    },
    oidcError: (state: OidcStoreState) => {
      return state.error;
    },
    oidcIsRoutePublic: (state: OidcStoreState) => {
      return (route: RouteLocationNormalized) => {
        return OidcRouter.IsRoutePublic(
          route,
          state.storeSettings?.publicRoutePaths,
          state.storeSettings?.isPublicRoute
        );
      };
    },
  };

  constructor(
    oidcStoreOidcClientSettings: OidcStoreOidcClientSettings,
    oidcStoreSettings: OidcStoreSettings = {},
    oidcStoreEventListeners: OidcStoreEventListener = {}
  ) {
    this._state.storeOidcClientSettings = oidcStoreOidcClientSettings;
    this._state.storeSettings = oidcStoreSettings;
    this._state.storeEventListeners = oidcStoreEventListeners;
    // default authentication is set to id_token
    this._state.storeSettings.isAuthenticatedBy ??= "id_token";
    this._state.storeOidcClient = new OidcStoreOidcClient(
      oidcStoreOidcClientSettings
    );
    //registering oidc event listeners
    Object.keys(this._state.storeEventListeners).forEach((eventName) => {
      const payload = {
        eventName: eventName,
        eventListener: this._state.storeEventListeners?.[eventName],
      };
      this._state.storeOidcClient?.AddOidcEventListener(payload);
    });
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
