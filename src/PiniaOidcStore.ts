import {
  defineStore,
  StateTree,
  StoreDefinition,
  _ActionsTree,
  _GettersTree,
  Store,
} from "pinia";
import type { User } from "oidc-client-ts";
import { RouteLocationNormalized } from "vue-router";
// Static Classes
import {
  OidcBrowserEvents,
  OidcUtils,
  PayloadType,
  OidcSigninSilentOptions,
  OidcRouter,
} from ".";
// Class StoreOidcClient used  as state member
import {
  StoreOidcClientSettings,
  OidcStoreSettings,
  StoreOidcListeners,
} from ".";
// Parent OidcStore Class
import {
  OidcStore,
  OidcStoreMembers,
  OidcStoreState,
  OidcStoreGetters,
  OidcStoreActions,
  OidcStoreMutations,
  OidcStoreActionsMutations,
} from ".";

export interface PiniaOidcStoreState extends StateTree, OidcStoreState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface PiniaOidcStoreGetters
  extends OidcStoreGetters,
    _GettersTree<PiniaOidcStoreState> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface PiniaOidcStoreActions
  extends OidcStoreActions,
    OidcStoreMutations,
    _ActionsTree {}

export type PiniaOidcStoreDefinition = StoreDefinition<
  "oidcAuth",
  PiniaOidcStoreState,
  PiniaOidcStoreGetters,
  PiniaOidcStoreActions
>;
export type PiniaOidcStoreType = Store<
  "oidcAuth",
  PiniaOidcStoreState,
  PiniaOidcStoreGetters,
  PiniaOidcStoreActions
>;

export class PiniaOidcStore extends OidcStore {
  private _actions: OidcStoreActionsMutations = {
    oidcCheckAccess(this: OidcStoreMembers, route: RouteLocationNormalized) {
      return new Promise((resolve) => {
        if (OidcRouter.IsRouteOidcCallback(route, this.oidcStoreSettings)) {
          resolve(true);
          return;
        }
        let hasAccess = true;
        const isAuthenticatedInStore = this.oid;
        this.storeOidcClient?.GetUser().then((user) => {
          if (!user || user.expired) {
            const authenticateSilently =
              this.oidcClientSettings.silentRedirectUri &&
              this.oidcClientSettings.automaticSilentSignin;
            if (OidcRouter.IsRoutePublic(route)) {
              if (isAuthenticatedInStore) {
                this.unsetOidcAuth();
              }
              if (authenticateSilently) {
                this.authenticateOidc();
                this.authenticateOidcSilent({
                  ignoreErrors: true,
                } as OidcSigninSilentOptions);
              }
            } else {
              const authenticate = () => {
                if (isAuthenticatedInStore) {
                  this.unsetOidcAuth();
                }
                this.authenticateOidc(route.fullPath);
              };
              // If silent signin is set up, try to authenticate silently before denying access
              if (authenticateSilently) {
                this.authenticateOidcSilent({
                  ignoreErrors: true,
                } as OidcSigninSilentOptions)
                  .then(() => {
                    this.storeOidcClient
                      ?.GetUser()
                      .then((user) => {
                        if (!user || user.expired) {
                          authenticate();
                        }
                        resolve(!!user);
                      })
                      .catch(() => {
                        authenticate();
                        resolve(false);
                      });
                  })
                  .catch(() => {
                    authenticate();
                    resolve(false);
                  });
                return;
              }
              // If no silent signin is set up, perform explicit authentication and deny access
              authenticate();
              hasAccess = false;
            }
          } else {
            this.oidcWasAuthenticated(user);
            if (!isAuthenticatedInStore) {
              if (
                this.storeOidcClient?.OidcEventListeners &&
                typeof this.storeOidcClient?.OidcEventListeners.userLoaded ===
                  "function"
              ) {
                this.storeOidcClient?.OidcEventListeners.userLoaded(user);
              }
              if (this.oidcStoreSettings.dispatchEventsOnWindow) {
                OidcBrowserEvents.DispatchCustomBrowserEvent(
                  "userLoaded",
                  user
                );
              }
            }
          }
          resolve(hasAccess);
        });
      });
    },
    authenticateOidcSilent(this: OidcStoreMembers, payload?: PayloadType) {
      // Take options for signinSilent from 1) payload or 2) this.storeOidcClient?.OidcStoreSettings if defined there
      const options = payload
        ? OidcUtils.PayloadItem(payload, "option")
        : {} || this.oidcStoreSettings.defaultSigninSilentOptions || {};
      return new Promise<User | null>((resolve, reject) => {
        this.storeOidcClient
          ?.SigninSilent(options)
          .then((user) => {
            this.oidcWasAuthenticated(user);
            resolve(user);
          })
          .catch((err) => {
            this.setOidcAuthIsChecked();
            if (payload && OidcUtils.PayloadItem(payload, "ignoreErrors")) {
              resolve(null);
            } else {
              this.setOidcError(
                OidcUtils.ErrorPayload("authenticateOidcSilent", err)
              );
              reject(err);
            }
          });
      });
    },
    authenticateOidc(this: OidcStoreMembers, payload?) {
      const redirectPath = payload
        ? OidcUtils.PayloadItem(payload, "redirectPath")
        : "";
      if (redirectPath) {
        sessionStorage.setItem("vue_oidc_active_route", redirectPath);
      } else {
        sessionStorage.removeItem("vue_oidc_active_route");
      }
      // Take options for signinRedirect from 1) payload or 2) storeSettings if defined there
      const options = payload
        ? OidcUtils.PayloadItem(payload, "options")
        : {} || this.oidcStoreSettings.defaultSigninRedirectOptions || {};
      return this.storeOidcClient
        ?.SigninRedirect(options)
        .catch((err: Error) =>
          this.setOidcError(OidcUtils.ErrorPayload("authenticateOidc", err))
        );
    },
    oidcSignInCallback(this: OidcStoreMembers, url) {
      return new Promise((resolve, reject) => {
        this.storeOidcClient
          ?.SigninRedirectCallback(url)
          .then((user) => {
            this.oidcWasAuthenticated(user);
            resolve(sessionStorage.getItem("vue_oidc_active_route") || "/");
          })
          .catch((err) => {
            this.setOidcError(
              OidcUtils.ErrorPayload("oidcSignInCallback", err)
            );
            this.setOidcAuthIsChecked;
            reject(err);
          });
      });
    },
    authenticateOidcPopup(this: OidcStoreMembers, payload?: PayloadType) {
      // Take options for signinPopup from 1) payload or 2) this.storeOidcClient?.OidcStoreSettings if defined there
      const options = payload
        ? OidcUtils.PayloadItem(payload, "options")
        : {} || this.oidcStoreSettings.defaultSigninPopupOptions || {};
      return this.storeOidcClient
        ?.SigninPopup(options)
        .then((user) => {
          this.oidcWasAuthenticated(user);
        })
        .catch((err) => {
          this.setOidcError(
            OidcUtils.ErrorPayload("authenticateOidcPopup", err)
          );
        });
    },
    oidcSignInPopupCallback(this: OidcStoreMembers, url) {
      return new Promise((resolve, reject) => {
        this.storeOidcClient?.SigninPopupCallback(url).catch((err) => {
          this.setOidcError(
            OidcUtils.ErrorPayload("oidcSignInPopupCallback", err)
          );
          this.setOidcAuthIsChecked();
          reject(err);
        });
      });
    },
    oidcWasAuthenticated(this: OidcStoreMembers, user) {
      if (user) {
        this.setOidcAuth(user);
      }
      if (!this.events_are_bound) {
        this.storeOidcClient?.AddAccessTokenExpired(() => {
          this.unsetOidcAuth();
        });
        if (this.oidcClientSettings.automaticSilentRenew) {
          this.storeOidcClient?.AddAccessTokenExpiring(() => {
            this.authenticateOidcSilent().catch((err) => {
              this.storeOidcClient?.DispatchCustomErrorEvent(
                "automaticSilentRenewError",
                OidcUtils.ErrorPayload("authenticateOidcSilent", err)
              );
            });
          });
        }
        this.setOidcEventsAreBound();
      }
      this.setOidcAuthIsChecked();
    },
    storeUser(this: OidcStoreMembers, user) {
      return this.storeOidcClient
        ?.StoreUser(user)
        .then(() => this.storeOidcClient?.GetUser())
        .then((user) => this.oidcWasAuthenticated(user))
        .catch((err) => {
          this.setOidcError(OidcUtils.ErrorPayload("OidcStoreUser", err));
          this.setOidcAuthIsChecked();
          throw err;
        });
    },
    getUser(this: OidcStoreMembers) {
      return this.storeOidcClient?.GetUser().then((user) => {
        if (user) this.setUser(user);
        return user;
      });
    },
    addOidcEventListener(this: OidcStoreMembers, payload) {
      this.storeOidcClient?.AddOidcEventListener(payload);
    },
    removeOidcEventListener(this: OidcStoreMembers, payload) {
      this.storeOidcClient?.RemoveOidcEventListener(payload);
    },
    signOutOidc(this: OidcStoreMembers, payload) {
      return this.storeOidcClient?.SignoutRedirect(payload).then(() => {
        this.unsetOidcAuth();
      });
    },
    signOutOidcCallback(this: OidcStoreMembers) {
      return this.storeOidcClient?.SignoutRedirectCallback();
    },
    signOutPopupOidc(this: OidcStoreMembers, payload) {
      return this.storeOidcClient?.SignoutPopup(payload).then(() => {
        this.unsetOidcAuth();
      });
    },
    signOutPopupOidcCallback(this: OidcStoreMembers) {
      return this.storeOidcClient?.SignoutPopupCallback();
    },
    signOutOidcSilent(this: OidcStoreMembers, payload) {
      return new Promise((resolve, reject) => {
        try {
          this.storeOidcClient
            ?.GetUser()
            .then((user) => {
              const args = OidcUtils.ObjectAssign([
                payload || {},
                {
                  id_token_hint: user ? user.id_token : null,
                },
              ]);
              if (payload && OidcUtils.PayloadItem(payload, "id_token_hint")) {
                args.id_token_hint = OidcUtils.PayloadItem(
                  payload,
                  "id_token_hint"
                );
              }
              this.storeOidcClient
                ?.CreateSignoutRequest(args)
                .then((signoutRequest) => {
                  OidcBrowserEvents.OpenUrlWithIframe(signoutRequest.url)
                    .then(() => {
                      this.removeUser();
                      resolve();
                    })
                    .catch((err) => reject(err));
                })
                .catch((err) => reject(err));
            })
            .catch((err) => reject(err));
        } catch (err) {
          reject(err);
        }
      });
    },
    removeUser(this: OidcStoreMembers) {
      return this.removeOidcUser();
    },
    removeOidcUser(this: OidcStoreMembers) {
      return this.storeOidcClient?.RemoveUser().then(() => {
        this.unsetOidcAuth();
      });
    },
    clearStaleState(this: OidcStoreMembers) {
      return this.storeOidcClient?.ClearStaleState();
    },
    // Mutations
    setOidcAuth(this: OidcStoreMembers, user: User) {
      this.user = user || null;
      this.error = null;
    },
    setUser(this: OidcStoreMembers, user: User) {
      this.user = user;
    },
    unsetOidcAuth(this: OidcStoreMembers) {
      this.user = null;
    },
    setOidcAuthIsChecked(this: OidcStoreMembers) {
      this.is_checked = true;
    },
    setOidcEventsAreBound(this: OidcStoreMembers) {
      this.events_are_bound = true;
    },
    setOidcError(this: OidcStoreMembers, payload: PayloadType) {
      if (payload) {
        this.error = OidcUtils.PayloadItem(payload, "error");
        this.storeOidcClient?.DispatchCustomErrorEvent("oidcError", payload);
      }
    },
  };
  constructor(
    storeOidcClientSettings: StoreOidcClientSettings,
    oidcStoreSettings?: OidcStoreSettings,
    oidcEventListeners?: StoreOidcListeners
  ) {
    super(storeOidcClientSettings, oidcStoreSettings, oidcEventListeners);
  }
  get Actions() {
    return this._actions;
  }
  get Mutations(): OidcStoreMutations {
    throw new Error("Method not implemented.");
  }
  CreateStore() {
    return defineStore({
      id: "oidcAuth",
      state: () => this._state as PiniaOidcStoreState,
      getters: this._getters as PiniaOidcStoreGetters,
      actions: this._actions as PiniaOidcStoreActions,
    });
  }
}
