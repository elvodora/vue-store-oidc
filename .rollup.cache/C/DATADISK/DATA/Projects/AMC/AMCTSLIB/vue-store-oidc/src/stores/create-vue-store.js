import { getOidcCallbackPath, createUserManager, addUserManagerEventListener, tokenIsExpired, tokenExp, createOidClient, removeUserManagerEventListener } from '../services/oidc-helpers';
import { dispatchCustomBrowserEvent } from '../services/browser-event';
export default (oidcClientSettings, storeSettings = {}, oidcEventListeners = {}) => {
    const oidcUserManager = createUserManager(oidcClientSettings);
    const oidcClient = createOidClient(oidcClientSettings);
    // default authentication is set to id_token
    if (!storeSettings.isAuthenticatedBy)
        storeSettings.isAuthenticatedBy = 'id_token';
    const oidcCallbackPath = getOidcCallbackPath(oidcClientSettings.redirect_uri, storeSettings.routeBase || '/');
    const oidcPopupCallbackPath = getOidcCallbackPath(oidcClientSettings.popupRedirectUri || '', storeSettings.routeBase || '/');
    const oidcSilentCallbackPath = getOidcCallbackPath(oidcClientSettings.silentRedirectUri || '', storeSettings.routeBase || '/');
    // Add event listeners passed into factory function
    Object.keys(oidcEventListeners).forEach(eventName => {
        addUserManagerEventListener(oidcUserManager, eventName, oidcEventListeners[eventName]);
    });
    let userManagerEvents;
    if (storeSettings.dispatchEventsOnWindow) {
        // Dispatch oidc-client events on window (if in browser)
        userManagerEvents = [
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
    const addOidcEventListener = (payload) => {
        addUserManagerEventListener(oidcUserManager, getPayloadItem(payload, 'eventName'), getPayloadItem(payload, 'eventListener'));
    };
    const removeOidcEventListener = (payload) => {
        removeUserManagerEventListener(oidcUserManager, getPayloadItem(payload, 'eventName'), getPayloadItem(payload, 'eventListener'));
    };
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
    const OidcStoreGetters = {
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
    // actions
    const authenticateOidc = (payload) => {
        const redirectPath = getPayloadItem(payload, 'redirectPath');
        if (redirectPath) {
            sessionStorage.setItem('vue_oidc_active_route', redirectPath);
        }
        else {
            sessionStorage.removeItem('vue_oidc_active_route');
        }
        // Take options for signinRedirect from 1) payload or 2) storeSettings if defined there
        const options = getPayloadItem(payload, 'options') || storeSettings.defaultSigninRedirectOptions || {};
        return oidcUserManager.signinRedirect(options);
    };
    return { oidcUserManager, oidcClient, OidcStoreGetters,
        routeIsPublic, routeIsOidcCallback, getPayloadItem, errorPayload,
        dispatchCustomErrorEvent, addOidcEventListener, removeOidcEventListener,
        authenticateOidc,
    };
};
//# sourceMappingURL=create-vue-store.js.map