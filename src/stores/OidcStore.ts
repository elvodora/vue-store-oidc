import type { RouteLocationNormalized } from "vue-router";

import {
  OidcStoreOidcClientSettings,
  OidcStoreEventListener,
  OidcStoreState,
  OidcStoreGetters,
  OidcStoreSettings,
  OidcStoreActions,
  OidcStoreMutations,
} from "../types";
import { OidcUtils } from "../services";
import { OidcStoreOidcClient } from "./OidcStoreOidcClient";

// Static Classes
import { OidcRouter } from "../router";

const _tokenExpiration = (token: string) => {
  const parsed = OidcUtils.ParseJwt(token);
  return parsed?.exp ? parsed.exp * 1000 : 0;
};
const _tokenIsExpired = (token: string) => {
  const tokenExpiryTime = _tokenExpiration(token);
  return tokenExpiryTime ? tokenExpiryTime < new Date().getTime() : false;
};

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
}
