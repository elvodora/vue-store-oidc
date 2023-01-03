import { defineStore, StateTree, _ActionsTree, _GettersTree } from "pinia";
import { RouteLocationNormalized } from "vue-router";
// Static Classes
import {
  OidcBrowserEvents,
  OidcUtils,
  PayloadType,
  OidcRouter,
  OidcObjectMapper,
  OidcUser,
  OidcStoreErrorEventListenersKey,
} from ".";
// Class OidcStoreOidcClient used  as state member
import { OidcStoreOidcClientSettings, OidcStoreSettings, OidcStoreEventListener } from ".";
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

export class PiniaOidcStore extends OidcStore {
  private _actions: OidcStoreActionsMutations = {
    oidcCheckAccess(this: OidcStoreMembers, route: RouteLocationNormalized) {
      return new Promise((resolve) => {
        if (OidcRouter.IsRouteOidcCallback(route)) {
          resolve(true);
          return;
        }
        let hasAccess = true;
        const isAuthenticatedInStore = this.storeSettings?.isAuthenticatedBy
          ? true
          : false;
        this.storeOidcClient?.UserExpired().then((oidcUserExpired) => {
          if (oidcUserExpired) {
            const authenticateSilently =
              this.storeOidcClientSettings?.silentRedirectUri &&
              this.storeOidcClientSettings.automaticSilentSignin;
            if (OidcRouter.IsRoutePublic(route)) {
              if (isAuthenticatedInStore) {
                this.unsetOidcAuth();
              }
              if (authenticateSilently) {
                this.authenticateOidcSilent({
                  ignoreErrors: true,
                });
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
                })
                  .then(() => {
                    this.storeOidcClient
                      ?.UserExpired()
                      .then((oidcUserExpired) => {
                        if (oidcUserExpired) {
                          authenticate();
                        }
                        resolve(!!this.getUser());
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
            this.getUser().then((user) => this.oidcWasAuthenticated(user));
            if (!isAuthenticatedInStore) {
              if (
                this.storeEventListeners &&
                typeof this.storeEventListeners.oidcUserLoaded === "function"
              ) {
                if (this.user)
                  this.storeEventListeners.oidcUserLoaded(this.user);
              }
              if (this.storeSettings?.dispatchEventsOnWindow) {
                OidcBrowserEvents.DispatchCustomBrowserEvent(
                  "userLoaded",
                  this.user as object
                );
              }
            }
          }
          resolve(hasAccess);
        });
      });
    },
    authenticateOidc(this: OidcStoreMembers, payload?) {
      const redirectPath = payload
        ? OidcUtils.PayloadItem(payload, "redirectPath")
        : null;
      if (redirectPath) {
        sessionStorage.setItem("vue_oidc_active_route", redirectPath);
      } else {
        sessionStorage.removeItem("vue_oidc_active_route");
      }
      const options = payload
        ? OidcUtils.PayloadItem(payload, "options")
        : this.storeSettings?.defaultSigninRedirectOptions || {};
      return this.storeOidcClient
        ?.SigninRedirect(options)
        .catch((err: Error) =>
          this.setOidcError(OidcUtils.ErrorPayload("authenticateOidc", err))
        );
    },
    authenticateOidcSilent(this: OidcStoreMembers, payload?: PayloadType) {
      const options = payload
        ? OidcUtils.PayloadItem(payload, "option")
        : this.storeSettings?.defaultSigninSilentOptions || {};
      return new Promise<OidcUser | null>((resolve, reject) => {
        this.storeOidcClient
          ?.SigninSilent(options)
          .then((status) => {
            if (status) return this.getUser();
            else return null;
          })
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
    authenticateOidcPopup(this: OidcStoreMembers, payload?: PayloadType) {
      return new Promise((resolve, reject) => {
        const options = payload
          ? OidcUtils.PayloadItem(payload, "options")
          : {} || this.storeSettings?.defaultSigninPopupOptions || {};
        this.storeOidcClient
          ?.SigninPopup(options)
          .then(() => this.getUser())
          .then((user) => {
            resolve(this.oidcWasAuthenticated(user));
          })
          .catch((err) => {
            this.setOidcError(
              OidcUtils.ErrorPayload("authenticateOidcPopup", err)
            );
            reject(err);
          });
      });
    },
    oidcSignInCallback(this: OidcStoreMembers, url) {
      return new Promise((resolve, reject) => {
        this.storeOidcClient
          ?.SigninRedirectCallback(url)
          .then(() => this.getUser())
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
        this.setOidcAuth(user);
      if (!this.eventsAreBound) {
        this.storeOidcClient?.AddAccessTokenExpired(() => {
          this.unsetOidcAuth();
        });
        if (this.storeOidcClientSettings?.automaticSilentRenew) {
          this.storeOidcClient?.AddAccessTokenExpiring(() => {
            this.authenticateOidcSilent().catch((err) => {
              this.dispatchCustomErrorEvent(
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
          this.getUser()
            .then((user) => {
              const args = OidcUtils.ObjectAssign([
                payload || {},
                {
                  id_token_hint: user ? user.id_token : null,
                },
              ]);
              if (payload && OidcUtils.PayloadItem(payload, "id_token_hint")) {
                OidcUtils.ObjectAssign([
                  args,
                  OidcUtils.PayloadItem(payload, "id_token_hint"),
                ]);
              }
              this.storeOidcClient
                ?.CreateSignoutRequest(args)
                .then((signoutRequest) => {
                  const url = OidcUtils.PayloadItem(signoutRequest, "url");
                  OidcBrowserEvents.OpenUrlWithIframe(url)
                    .then(() => {
                      this.removeUser();
                      resolve();
                    })
                    .catch((err) => reject(err));
                })
                .catch((err: Error) => reject(err));
            })
            .catch((err) => reject(err));
        } catch (err) {
          reject(err);
        }
      });
    },
    getUser(this: OidcStoreMembers) {
      return new Promise((resolve, reject) => {
        this.storeOidcClient
          ?.GetUser()
          .then((user) => {
            let oidcUser = null;
            if (user) {
              oidcUser = OidcObjectMapper.User_To_OidcUser(user);
              this.setUser(oidcUser);
            }
            resolve(oidcUser);
          })
          .catch((err) => {
            this.setOidcError(OidcUtils.ErrorPayload("getUser", err));
            this.setOidcAuthIsChecked;
            reject(err);
          });
      });
    },
    storeUser(this: OidcStoreMembers) {
      return this.storeOidcClient
        ?.StoreUser()
        .then(() => this.getUser())
        .then((user) => this.oidcWasAuthenticated(user))
        .catch((err) => {
          this.setOidcError(OidcUtils.ErrorPayload("OidcUser", err));
          this.setOidcAuthIsChecked();
          throw err;
        });
    },
    removeUser(this: OidcStoreMembers) {
      return new Promise((resolve, reject) => {
        this.storeOidcClient
          ?.RemoveUser()
          .then(() => {
            this.unsetOidcAuth();
          })
          .catch((err) => reject(err));
      });
    },
    addOidcEventListener(this: OidcStoreMembers, payload) {
      this.storeOidcClient?.AddOidcEventListener(payload);
    },
    removeOidcEventListener(this: OidcStoreMembers, payload) {
      this.storeOidcClient?.RemoveOidcEventListener(payload);
    },
    clearStaleState(this: OidcStoreMembers) {
      return this.storeOidcClient?.ClearStaleState();
    },
    dispatchCustomErrorEvent(
      this: OidcStoreMembers,
      eventName: OidcStoreErrorEventListenersKey,
      payload: PayloadType
    ) {
      if (typeof this.storeEventListeners?.[eventName] === "function") {
        this.storeEventListeners[eventName]?.(payload);
      }
    },
    // Mutations
    setOidcAuth(this: OidcStoreMembers, user: OidcUser | null) {
      this.user = user;
      this.error = null;
    },
    setUser(this: OidcStoreMembers, user: OidcUser | null) {
      this.user = user ;
    },
    unsetOidcAuth(this: OidcStoreMembers) {
      this.user = null;
    },
    setOidcAuthIsChecked(this: OidcStoreMembers) {
      this.isChecked = true;
    },
    setOidcEventsAreBound(this: OidcStoreMembers) {
      this.eventsAreBound = true;
    },
    setOidcError(this: OidcStoreMembers, payload: PayloadType) {
      if (payload) {
        this.error = OidcUtils.PayloadItem(payload, "error");
        this.dispatchCustomErrorEvent("oidcError", payload);
      }
    },
  };
  constructor(
    storeOidcClientSettings: OidcStoreOidcClientSettings,
    storeSettings?: OidcStoreSettings,
    storeEventListeners?: OidcStoreEventListener
  ) {
    super(storeOidcClientSettings, storeSettings, storeEventListeners);
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
