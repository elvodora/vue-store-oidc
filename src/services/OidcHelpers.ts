import { OidcClient, OidcClientSettings, UserManager, UserManagerEvents } from "oidc-client-ts";
import type { StoreOidcListeners, StoreOidcClientSettings } from "..";

import { OidcUtils } from '..'

const _requiredConfigProperties = [
  "authority",
  "client_id",
  "redirect_uri",
  "response_type",
  "scope",
]

export type TUserManagerEventsMethod = keyof UserManagerEvents;

export const OidcHelpers = {

  GetOidcCallbackPath: (callbackUri: string, routeBase = "/") => {
    if (callbackUri) {
      const domainStartsAt = "://";
      const hostAndPath = callbackUri.substring(
        callbackUri.indexOf(domainStartsAt) + domainStartsAt.length
      );
      return hostAndPath
        .substring(hostAndPath.indexOf(routeBase) + routeBase.length - 1)
        .replace(/\/$/, "");
    }
    return null;
  },
  CreateUserManager: (oidcSettings: StoreOidcClientSettings) => {
    _requiredConfigProperties.forEach((requiredProperty) => {
      if (!oidcSettings[requiredProperty]) {
        throw new Error(
          "Required oidc setting " +
          requiredProperty +
          " missing for creating UserManager"
        );
      }
    });
    return new UserManager(oidcSettings);
  },
  CreateOidcClient: (oidcSettings: StoreOidcClientSettings) => {
    _requiredConfigProperties.forEach((requiredProperty) => {
      if (!oidcSettings[requiredProperty]) {
        throw new Error(
          "Required oidc setting " +
          requiredProperty +
          " missing for creating OidcClient"
        );
      }
    });
    return new OidcClient(oidcSettings);
  },
  TokenExp: (token: string) => {
    const parsed = OidcUtils.ParseJwt(token);
    return parsed?.exp ? parsed.exp * 1000 : 0;
  },
  TokenIsExpired: (token: string) => {
    const tokenExpiryTime = OidcHelpers.TokenExp(token)
    return tokenExpiryTime ? tokenExpiryTime < new Date().getTime() : false;
  },
  AddUserManagerEventListener: (
    oidcUserManager: UserManager,
    eventName: string,
    eventListener: StoreOidcListeners) => {
    const addFnName = "add" + OidcUtils.FirstLetterUppercase(eventName);
    if (
      typeof oidcUserManager.events[addFnName as TUserManagerEventsMethod] ===
      "function" &&
      typeof eventListener === "function"
    ) {
      oidcUserManager.events[addFnName as TUserManagerEventsMethod](
        eventListener
      );
    }
  },
  RemoveUserManagerEventListener: (
    oidcUserManager: UserManager,
    eventName: string,
    eventListener: any) => {
    const removeFnName = "remove" + OidcUtils.FirstLetterUppercase(eventName);
    if (
      typeof oidcUserManager.events[removeFnName as TUserManagerEventsMethod] ===
      "function" &&
      typeof eventListener === "function"
    ) {
      oidcUserManager.events[removeFnName as TUserManagerEventsMethod](
        eventListener
      );
    }
  },
  processSignInCallback: (oidcSettings: OidcClientSettings) => {
    return new Promise((resolve, reject) => {
      const oidcUserManager = OidcHelpers.CreateUserManager(oidcSettings);
      oidcUserManager
        .signinRedirectCallback()
        .then(() => {
          resolve(sessionStorage.getItem("store_oidc_active_route") || "/");
        })
        .catch((err: Error) => {
          reject(err);
        });
    });
  },
}