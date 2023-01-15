import {
  AccessTokenCallback,
  OidcClientSettings,
  SigninPopupArgs,
  SigninRedirectArgs,
  SigninSilentArgs,
  SignoutSilentArgs,
  SignoutPopupArgs,
  SignoutRedirectArgs,
  UserManager,
  UserManagerEvents,
} from "oidc-client-ts";

import { OidcObjectMapper, OidcUtils } from "../services";
import { PayloadType } from "../types";


export type UserManagerEventsKeys = keyof UserManagerEvents;

/**
 * Class responsible for comunication between external oidc library (in this case: oidc-client-ts) and 
 * OidStore classes (PiniaOidcStore and VuexOidcStore).
 * The class is used as a member in a OidStore classes.
 */
export class OidcStoreOidcClient {
  private _userManager: UserManager;
/**
 * To preserve as much independence as possible between the libraries, 
 * we as param type use {@link PayloadType} and {@link OidcObjectMapper} static class 
 * to exchange object data between classes.
 * @param storeOidcClientSettings OidcClientSettings from OidcStore classes
 */
  constructor(storeOidcClientSettings: PayloadType) {
    const oidcClientSettings:OidcClientSettings = OidcObjectMapper.OidcStoreOidcClientSettings_To_OidcClientSettings(
      storeOidcClientSettings
    );
    this._userManager = new UserManager(oidcClientSettings);
  }
  GetUser = () =>
    this._userManager.getUser().then((user) => user as PayloadType);
  UserExpired = () =>
    this._userManager.getUser().then((user) => !user || user?.expired);
  RemoveUser = () => this._userManager.removeUser();
  StoreUser = () =>
    this._userManager
      .getUser()
      .then((user) => this._userManager.storeUser(user));
  ClearStaleState = () => this._userManager.clearStaleState();
  AddOidcEventListener = (payload: PayloadType) => {
    const eventName = OidcUtils.PayloadItem(payload, "eventName");
    const addFnName = "add" + OidcUtils.FirstLetterUppercase(eventName);
    const eventListener = OidcUtils.PayloadItem(payload, "eventListener");
    if (
      typeof this._userManager.events[addFnName as UserManagerEventsKeys] ===
        "function" &&
      typeof eventListener === "function"
    ) {
      this._userManager.events[addFnName as UserManagerEventsKeys](
        eventListener
      );
    }
  };
  RemoveOidcEventListener = (payload: PayloadType) => {
    const eventName = OidcUtils.PayloadItem(payload, "eventName");
    const removeFnName = "add" + OidcUtils.FirstLetterUppercase(eventName);
    const eventListener = OidcUtils.PayloadItem(payload, "eventListener");
    if (
      typeof this._userManager.events[removeFnName as UserManagerEventsKeys] ===
        "function" &&
      typeof eventListener === "function"
    ) {
      this._userManager.events[removeFnName as UserManagerEventsKeys](
        eventListener
      );
    }
  };
  AddAccessTokenExpired = (cb: AccessTokenCallback) =>
    this._userManager.events.addAccessTokenExpired(cb);
  AddAccessTokenExpiring = (cb: AccessTokenCallback) =>
    this._userManager.events.addAccessTokenExpiring(cb);
  SigninSilent = (options?: PayloadType) =>
    this._userManager
      .signinSilent(<SigninSilentArgs>options)
      .then((user) => (user ? true : false));
  SigninRedirect = (options?: PayloadType) =>
    this._userManager.signinRedirect(<SigninRedirectArgs>options);
  SigninRedirectCallback = (options?: PayloadType) =>
    this._userManager
      .signinRedirectCallback(<string>options)
      .then((user) => (user ? true : false));
  SigninPopup = (options?: PayloadType) =>
    this._userManager
      .signinPopup(<SigninPopupArgs>options)
      .then((user) => (user ? true : false));
  SigninPopupCallback = (options?: PayloadType) =>
    this._userManager.signinPopupCallback(<string>options);
  SignoutRedirect = (options?: PayloadType) =>
    this._userManager.signoutRedirect(<SignoutRedirectArgs>options);
  SignoutRedirectCallback = (options?: PayloadType) =>
    this._userManager
      .signoutRedirectCallback(<string>options)
      .then(() => Promise.resolve());
  SignoutPopup = (options?: PayloadType) =>
    this._userManager.signoutPopup(<SignoutPopupArgs>options);
  SignoutPopupCallback = (options?: PayloadType) =>
    this._userManager.signoutPopupCallback(<string>options);
  SignoutSilent = (options: PayloadType) =>
    this._userManager
      .signoutSilent(<SignoutSilentArgs>options)
      .then((signoutRequest) => signoutRequest);
}
