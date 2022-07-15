import createOidcStore from './create-vue-store';
import { objectAssign } from '../services/utils';
import { dispatchCustomBrowserEvent } from '../services/browser-event';
import { openUrlWithIframe } from '../services/navigation';
import { defineStore } from 'pinia';
export default (oidcClientSettings, storeSettings = {}, oidcEventListeners = {}) => {
    const { oidcUserManager, oidcClient, OidcStoreGetters, routeIsPublic, routeIsOidcCallback, getPayloadItem, errorPayload, dispatchCustomErrorEvent, addOidcEventListener, removeOidcEventListener, authenticateOidc, } = createOidcStore(oidcClientSettings, storeSettings, oidcEventListeners);
    const PiniaOidcStoreState = {
        access_token: null,
        id_token: null,
        refresh_token: null,
        user: null,
        scopes: null,
        is_checked: false,
        events_are_bound: false,
        error: null
    };
    const PiniaOidcStoreGetters = OidcStoreGetters;
    const PiniaOidcStoreAction = {
        oidcCheckAccess(route) {
            return new Promise(resolve => {
                if (routeIsOidcCallback(route)) {
                    resolve(true);
                    return;
                }
                let hasAccess = true;
                const isAuthenticatedInStore = this.oidcIsAuthenticated;
                oidcUserManager.getUser().then(user => {
                    if (!user || user.expired) {
                        const authenticateSilently = oidcClientSettings.silentRedirectUri && oidcClientSettings.automaticSilentSignin;
                        if (routeIsPublic(route)) {
                            if (isAuthenticatedInStore) {
                                this.unsetOidcAuth();
                            }
                            if (authenticateSilently) {
                                this.authenticateOidc();
                                this.authenticateOidcSilent({ ignoreErrors: true })
                                    .catch(() => { });
                            }
                        }
                        else {
                            const authenticate = () => {
                                if (isAuthenticatedInStore) {
                                    this.unsetOidcAuth();
                                }
                                this.authenticateOidc(route.fullPath);
                            };
                            // If silent signin is set up, try to authenticate silently before denying access
                            if (authenticateSilently) {
                                this.authenticateOidcSilent({ ignoreErrors: true })
                                    .then(() => {
                                    oidcUserManager.getUser().then(user => {
                                        if (!user || user.expired) {
                                            authenticate();
                                        }
                                        resolve(!!user);
                                    }).catch(() => {
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
                    }
                    else {
                        this.oidcWasAuthenticated(user);
                        if (!isAuthenticatedInStore) {
                            if (oidcEventListeners && typeof oidcEventListeners.userLoaded === 'function') {
                                oidcEventListeners.userLoaded(user);
                            }
                            if (storeSettings.dispatchEventsOnWindow) {
                                dispatchCustomBrowserEvent('userLoaded', user);
                            }
                        }
                    }
                    resolve(hasAccess);
                });
            });
        },
        authenticateOidcSilent(payload) {
            // Take options for signinSilent from 1) payload or 2) storeSettings if defined there
            const options = getPayloadItem(payload, 'option') || storeSettings.defaultSigninSilentOptions || {};
            return new Promise((resolve, reject) => {
                oidcUserManager.signinSilent(options)
                    .then(user => {
                    this.oidcWasAuthenticated(user);
                    resolve(user);
                })
                    .catch(err => {
                    this.setOidcAuthIsChecked();
                    if (getPayloadItem(payload, 'ignoreErrors')) {
                        resolve(null);
                    }
                    else {
                        this.setOidcError(errorPayload('authenticateOidcSilent', err));
                        reject(err);
                    }
                });
            });
        },
        authenticateOidc(payload) {
            return authenticateOidc(payload)
                .catch(err => this.setOidcError(errorPayload('authenticateOidc', err)));
        },
        oidcSignInCallback(url) {
            return new Promise((resolve, reject) => {
                oidcUserManager.signinRedirectCallback(url)
                    .then(user => {
                    this.oidcWasAuthenticated(user);
                    resolve(sessionStorage.getItem('vue_oidc_active_route') || '/');
                })
                    .catch(err => {
                    this.setOidcError(errorPayload('oidcSignInCallback', err));
                    this.setOidcAuthIsChecked;
                    reject(err);
                });
            });
        },
        authenticateOidcPopup(payload = {}) {
            // Take options for signinPopup from 1) payload or 2) storeSettings if defined there
            const options = getPayloadItem(payload, 'options') || storeSettings.defaultSigninPopupOptions || {};
            return oidcUserManager.signinPopup(options)
                .then(user => {
                this.oidcWasAuthenticated(user);
            })
                .catch(err => {
                this.setOidcError(errorPayload('authenticateOidcPopup', err));
            });
        },
        oidcSignInPopupCallback(url) {
            return new Promise((resolve, reject) => {
                oidcUserManager.signinPopupCallback(url)
                    .catch(err => {
                    this.setOidcError(errorPayload('oidcSignInPopupCallback', err));
                    this.setOidcAuthIsChecked();
                    reject(err);
                });
            });
        },
        oidcWasAuthenticated(user) {
            if (user) {
                this.setOidcAuth(user);
            }
            if (!this.events_are_bound) {
                oidcUserManager.events.addAccessTokenExpired(() => { this.unsetOidcAuth(); });
                if (oidcClientSettings.automaticSilentRenew) {
                    oidcUserManager.events.addAccessTokenExpiring(() => {
                        this.authenticateOidcSilent()
                            .catch((err) => {
                            dispatchCustomErrorEvent('automaticSilentRenewError', errorPayload('authenticateOidcSilent', err));
                        });
                    });
                }
                this.setOidcEventsAreBound();
            }
            this.setOidcAuthIsChecked();
        },
        storeUser(user) {
            return oidcUserManager.storeUser(user)
                .then(() => oidcUserManager.getUser())
                .then(user => this.oidcWasAuthenticated(user))
                .then(() => { })
                .catch(err => {
                this.setOidcError(errorPayload('OidcStoreUser', err));
                this.setOidcAuthIsChecked();
                throw err;
            });
        },
        getUser() {
            return oidcUserManager.getUser().then(user => {
                if (user) {
                    this.setUser(user);
                }
                return user;
            });
        },
        addOidcEventListener(payload) {
            addOidcEventListener(payload);
        },
        removeOidcEventListener(payload) {
            removeOidcEventListener(payload);
        },
        signOutOidc(payload) {
            return oidcUserManager.signoutRedirect(payload).then(() => {
                this.unsetOidcAuth();
            });
        },
        signOutOidcCallback() {
            return oidcUserManager.signoutRedirectCallback();
        },
        signOutPopupOidc(payload) {
            return oidcUserManager.signoutPopup(payload).then(() => {
                this.unsetOidcAuth();
            });
        },
        signOutPopupOidcCallback() {
            return oidcUserManager.signoutPopupCallback();
        },
        signOutOidcSilent(payload) {
            return new Promise((resolve, reject) => {
                try {
                    oidcUserManager.getUser()
                        .then((user) => {
                        const args = objectAssign([
                            payload || {},
                            {
                                id_token_hint: user ? user.id_token : null
                            }
                        ]);
                        if (payload && getPayloadItem(payload, 'id_token_hint')) {
                            args.id_token_hint = getPayloadItem(payload, 'id_token_hint');
                        }
                        if (oidcClient) {
                            oidcClient.createSignoutRequest(args)
                                .then((signoutRequest) => {
                                openUrlWithIframe(signoutRequest.url)
                                    .then(() => {
                                    this.removeUser();
                                    resolve();
                                })
                                    .catch((err) => reject(err));
                            })
                                .catch((err) => reject(err));
                        }
                    })
                        .catch((err) => reject(err));
                }
                catch (err) {
                    reject(err);
                }
            });
        },
        removeUser() {
            return this.removeUser();
        },
        removeUser() {
            return oidcUserManager.removeUser().then(() => {
                this.unsetOidcAuth();
            });
        },
        clearStaleState() {
            return oidcUserManager.clearStaleState();
        },
        //mutation
        setOidcAuth(user) {
            this.id_token = user.id_token;
            this.access_token = user.access_token;
            this.refresh_token = user.refresh_token;
            this.user = user.profile;
            this.scopes = user.scopes;
            this.error = null;
        },
        setUser(user) {
            this.user = user ? user.profile : null;
        },
        unsetOidcAuth() {
            this.id_token = null;
            this.access_token = null;
            this.refresh_token = null;
            this.user = null;
        },
        setOidcAuthIsChecked() {
            this.is_checked = true;
        },
        setOidcEventsAreBound() {
            this.events_are_bound = true;
        },
        setOidcError(payload) {
            if (payload) {
                this.error = getPayloadItem(payload, 'error');
                dispatchCustomErrorEvent('oidcError', payload);
            }
        }
    };
    return defineStore({ id: 'auth', state: () => PiniaOidcStoreState, getters: PiniaOidcStoreGetters, actions: PiniaOidcStoreAction });
};
//# sourceMappingURL=create-pinia-store.js.map