import { objectAssign } from '../services/utils';
import { getOidcCallbackPath, createUserManager, addUserManagerEventListener, removeUserManagerEventListener, tokenIsExpired, tokenExp } from '../services/oidc-helpers';
import { dispatchCustomBrowserEvent } from '../services/browser-event';
import { openUrlWithIframe } from '../services/navigation';
import { defineStore } from 'pinia';
import { OidcClient } from 'oidc-client-ts';
export default (oidcClientSettings, storeSettings = {}, oidcEventListeners = {}) => {
    const oidcUserManager = createUserManager(oidcClientSettings);
    if (!storeSettings.isAuthenticatedBy)
        storeSettings.isAuthenticatedBy = 'id_token';
    const oidcCallbackPath = getOidcCallbackPath(oidcClientSettings.redirect_uri, storeSettings.routeBase || '/');
    const oidcPopupCallbackPath = getOidcCallbackPath(oidcClientSettings.popupRedirectUri || '', storeSettings.routeBase || '/');
    const oidcSilentCallbackPath = getOidcCallbackPath(oidcClientSettings.silentRedirectUri || '', storeSettings.routeBase || '/');
    // Add event listeners passed into factory function
    Object.keys(oidcEventListeners).forEach(eventName => {
        addUserManagerEventListener(oidcUserManager, eventName, oidcEventListeners[eventName]);
    });
    if (storeSettings.dispatchEventsOnWindow) {
        // Dispatch oidc-client events on window (if in browser)
        const userManagerEvents = [
            'userLoaded',
            'userUnloaded',
            'accessTokenExpiring',
            'accessTokenExpired',
            'silentRenewError',
            'userSignedOut'
        ];
        userManagerEvents.forEach(eventName => {
            addUserManagerEventListener(oidcUserManager, eventName, (detail) => {
                dispatchCustomBrowserEvent(eventName, detail || {});
            });
        });
    }
    const routeIsPublic = (route) => {
        if (route.meta && route.meta.isPublic) {
            return true;
        }
        if (route.meta && Array.isArray(route.meta) && route.meta.reduce((isPublic, meta) => meta.isPublic || isPublic, false)) {
            return true;
        }
        if (storeSettings.publicRoutePaths && storeSettings.publicRoutePaths.map(path => path.replace(/\/$/, '')).indexOf(route.path.replace(/\/$/, '')) > -1) {
            return true;
        }
        if (storeSettings.isPublicRoute && typeof storeSettings.isPublicRoute === 'function') {
            return storeSettings.isPublicRoute(route);
        }
        return false;
    };
    const routeIsOidcCallback = (route) => {
        if (route.meta && route.meta.isOidcCallback) {
            return true;
        }
        if (route.meta && Array.isArray(route.meta) && route.meta.reduce((isOidcCallback, meta) => meta.isOidcCallback || isOidcCallback, false)) {
            return true;
        }
        if (route.path && route.path.replace(/\/$/, '') === oidcCallbackPath) {
            return true;
        }
        if (route.path && route.path.replace(/\/$/, '') === oidcPopupCallbackPath) {
            return true;
        }
        if (route.path && route.path.replace(/\/$/, '') === oidcSilentCallbackPath) {
            return true;
        }
        return false;
    };
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
    const getPayloadItem = (payload, option) => {
        if (payload) {
            if (typeof payload === 'string') {
                return payload;
            }
            else {
                if (option in payload) {
                    if (payload.option)
                        return option;
                }
            }
        }
        return null;
    };
    const PiniaOidcStoreGetters = {
        oidcIsAuthenticated: (state) => {
            if (storeSettings.isAuthenticatedBy) {
                if (state[storeSettings.isAuthenticatedBy]) {
                    return true;
                }
            }
            return false;
        },
        oidcUser: (state) => {
            return state.user;
        },
        oidcAccessToken: (state) => {
            return tokenIsExpired(state.access_token) ? null : state.access_token;
        },
        oidcAccessTokenExp: (state) => {
            return tokenExp(state.access_token);
        },
        oidcScopes: (state) => {
            return state.scopes;
        },
        oidcIdToken: (state) => {
            return tokenIsExpired(state.id_token) ? null : state.id_token;
        },
        oidcIdTokenExp: (state) => {
            return tokenExp(state.id_token);
        },
        oidcRefreshToken: (state) => {
            return tokenIsExpired(state.refresh_token) ? null : state.refresh_token;
        },
        oidcRefreshTokenExp: (state) => {
            return tokenExp(state.refresh_token);
        },
        oidcAuthenticationIsChecked: (state) => {
            return state.is_checked;
        },
        oidcError: (state) => {
            return state.error;
        },
        oidcIsRoutePublic: (state) => {
            return (route) => {
                return routeIsPublic(route);
            };
        }
    };
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
                        }
                        // If silent signin is set up, try to authenticate silently before denying access
                        if (authenticateSilently) {
                            this.authenticateOidcSilent({ ignoreErrors: true })
                                .then(() => {
                                oidcUserManager.getUser().then(user => {
                                    if (!user || user.expired) {
                                        this.authenticate();
                                    }
                                    resolve(!!user);
                                }).catch(() => {
                                    this.authenticate();
                                    resolve(false);
                                });
                            })
                                .catch(() => {
                                this.authenticate();
                                resolve(false);
                            });
                            return;
                        }
                        // If no silent signin is set up, perform explicit authentication and deny access
                        this.authenticate();
                        hasAccess = false;
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
            const redirectPath = getPayloadItem(payload, 'redirectPath');
            if (redirectPath) {
                sessionStorage.setItem('vue_oidc_active_route', redirectPath);
            }
            else {
                sessionStorage.removeItem('vue_oidc_active_route');
            }
            // Take options for signinRedirect from 1) payload or 2) storeSettings if defined there
            const options = getPayloadItem(payload, 'options') || storeSettings.defaultSigninRedirectOptions || {};
            return oidcUserManager.signinRedirect(options)
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
            addUserManagerEventListener(oidcUserManager, getPayloadItem(payload, 'eventName'), getPayloadItem(payload, 'eventListener'));
        },
        removeOidcEventListener(payload) {
            removeUserManagerEventListener(oidcUserManager, getPayloadItem(payload, 'eventName'), getPayloadItem(payload, 'eventListener'));
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
                        const oidcClient = new OidcClient(oidcUserManager.settings);
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
    const errorPayload = (context, error) => {
        return {
            context,
            error: error && error.message ? error.message : error
        };
    };
    const dispatchCustomErrorEvent = (eventName, payload) => {
        // oidcError and automaticSilentRenewError are not UserManagement events, they are events implemeted in vuex-oidc,
        if (typeof oidcEventListeners[eventName] === 'function') {
            oidcEventListeners[eventName](payload);
        }
        if (storeSettings.dispatchEventsOnWindow) {
            dispatchCustomBrowserEvent(eventName, payload);
        }
    };
    return defineStore({ id: 'auth', state: () => PiniaOidcStoreState, getters: PiniaOidcStoreGetters, actions: PiniaOidcStoreAction });
};
//# sourceMappingURL=create-pinia-store-old.js.map