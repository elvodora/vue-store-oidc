import {
  AccessTokenCallback,
  OidcClient,
  OidcClientSettings,
  SigninPopupArgs,
  SigninRedirectArgs,
  SigninSilentArgs,
  SignoutPopupArgs,
  SignoutRedirectArgs,
  User,
  UserManager,
} from "oidc-client-ts";
import { OidcUtils, PayloadType } from ".";
import { OidcHelpers } from ".";

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

type StoreOidcListenersKeyType =
  | ((user: User) => void)
  | (() => void)
  | ((payload?: PayloadType) => void)
  | undefined;

type StoreOidcErrorListenersKey = "oidcError" | "automaticSilentRenewError";

export interface StoreOidcListeners {
  userLoaded?: (user: User) => void;
  userUnloaded?: () => void;
  accessTokenExpiring?: () => void;
  accessTokenExpired?: () => void;
  silentRenewError?: () => void;
  userSignedOut?: () => void;
  oidcError?: (payload?: PayloadType) => void;
  automaticSilentRenewError?: (payload?: PayloadType) => void;
  [key: string]: StoreOidcListenersKeyType;
}

export interface StoreOidcClientSettings extends OidcClientSettings {
  loginHint?: string;
  popupRedirectUri?: string;
  silentRedirectUri?: string;
  automaticSilentRenew?: boolean;
  automaticSilentSignin?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Class containing information about oidc-client-ts current UserManager, settings, and Event Listeners
 * This class is used as a object in a OidcStore classes (PiniaOidcStore and VuexOidcStore)
 */
export class StoreOidcClient {
  private _oidcClient: OidcClient;
  private _userManager: UserManager;
  private _oidcClientSettings: StoreOidcClientSettings;
  private _oidcEventListeners: StoreOidcListeners;

  constructor(
    oidcClientSettings: StoreOidcClientSettings,
    oidcEventListeners?: StoreOidcListeners
  ) {
    this._userManager = OidcHelpers.CreateUserManager(oidcClientSettings);
    this._oidcClient = OidcHelpers.CreateOidcClient(oidcClientSettings);
    this._oidcClientSettings = oidcClientSettings;
    this._oidcEventListeners = oidcEventListeners ? oidcEventListeners : {};
  }
  DispatchCustomErrorEvent = (
    eventName: StoreOidcErrorListenersKey,
    payload: PayloadType
  ) => {
    // oidcError and automaticSilentRenewError are not UserManagement events, they are events implemeted in vue-store-oidc,
    if (typeof this._oidcEventListeners[eventName] === "function") {
      this._oidcEventListeners[eventName]?.(payload);
    }
  };
  get OidcClientSettings() {
    return this._oidcClientSettings;
  }
  get OidcEventListeners() {
    return this._oidcEventListeners;
  }
  GetUser = () => this._userManager.getUser();
  RemoveUser = () => this._userManager.removeUser();
  StoreUser = (user: User | null) => this._userManager.storeUser(user);
  ClearStaleState = () => this._userManager.clearStaleState();
  AddOidcEventListener = (payload: PayloadType) => {
    OidcHelpers.AddUserManagerEventListener(
      this._userManager,
      OidcUtils.PayloadItem(payload, "eventName"),
      OidcUtils.PayloadItem(payload, "eventListener")
    );
  };
  RemoveOidcEventListener = (payload: PayloadType) => {
    OidcHelpers.RemoveUserManagerEventListener(
      this._userManager,
      OidcUtils.PayloadItem(payload, "eventName"),
      OidcUtils.PayloadItem(payload, "eventListener")
    );
  };
  AddAccessTokenExpired = (cb: AccessTokenCallback) =>
    this._userManager.events.addAccessTokenExpired(cb);
  AddAccessTokenExpiring = (cb: AccessTokenCallback) =>
    this._userManager.events.addAccessTokenExpiring(cb);
  SigninSilent = (options?: PayloadType) =>
    this._userManager.signinSilent(<SigninSilentArgs>options);
  SigninRedirect = (options?: PayloadType) =>
    this._userManager.signinRedirect(<SigninRedirectArgs>options);
  SigninRedirectCallback = (options?: PayloadType) =>
    this._userManager.signinRedirectCallback(<string>options);
  SigninPopup = (options?: PayloadType) =>
    this._userManager.signinPopup(<SigninPopupArgs>options);
  SigninPopupCallback = (options?: PayloadType) =>
    this._userManager.signinPopupCallback(<string>options);
  SignoutRedirect = (options?: PayloadType) =>
    this._userManager.signoutRedirect(<SignoutRedirectArgs>options);
  SignoutRedirectCallback = (options?: PayloadType) =>
    this._userManager.signoutRedirectCallback(<string>options);
  SignoutPopup = (options?: PayloadType) =>
    this._userManager.signoutPopup(<SignoutPopupArgs>options);
  SignoutPopupCallback = (options?: PayloadType) =>
    this._userManager.signoutPopupCallback(<string>options);
  CreateSignoutRequest = (args: any) =>
    this._oidcClient.createSignoutRequest(args);
}
