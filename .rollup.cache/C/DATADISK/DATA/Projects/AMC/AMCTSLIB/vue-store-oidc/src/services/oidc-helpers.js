import { objectAssign, parseJwt, firstLetterUppercase, camelCaseToSnakeCase, } from "./utils";
import { OidcClient, UserManager, WebStorageStateStore, } from "oidc-client-ts";
const defaultOidcConfig = {
    userStore: new WebStorageStateStore(),
    loadUserInfo: true,
    automaticSilentSignin: true,
};
const requiredConfigProperties = [
    "authority",
    "client_id",
    "redirect_uri",
    "response_type",
    "scope",
];
const settingsThatAreSnakeCasedInOidcClient = [
    "clientId",
    "redirectUri",
    "responseType",
    "maxAge",
    "uiLocales",
    "loginHint",
    "acrValues",
    "postLogoutRedirectUri",
    "popupRedirectUri",
    "silentRedirectUri",
];
const snakeCasedSettings = (oidcSettings) => {
    let snakeCasedOidcSettings = null;
    settingsThatAreSnakeCasedInOidcClient.forEach((setting) => {
        if (typeof oidcSettings[setting] !== "undefined") {
            snakeCasedOidcSettings[camelCaseToSnakeCase(setting)] =
                oidcSettings[setting];
        }
    });
    return oidcSettings;
};
export const getOidcConfig = (oidcSettings) => {
    return objectAssign([
        defaultOidcConfig,
        snakeCasedSettings(oidcSettings),
        { automaticSilentRenew: false }, // automaticSilentRenew is handled in pinia and not by user manager
    ]);
};
export const getOidcCallbackPath = (callbackUri, routeBase = "/") => {
    if (callbackUri) {
        const domainStartsAt = "://";
        const hostAndPath = callbackUri.substring(callbackUri.indexOf(domainStartsAt) + domainStartsAt.length);
        return hostAndPath
            .substring(hostAndPath.indexOf(routeBase) + routeBase.length - 1)
            .replace(/\/$/, "");
    }
    return null;
};
export const createUserManager = (oidcSettings) => {
    requiredConfigProperties.forEach((requiredProperty) => {
        if (!oidcSettings[requiredProperty]) {
            throw new Error("Required oidc setting " +
                requiredProperty +
                " missing for creating UserManager");
        }
    });
    return new UserManager(oidcSettings);
};
export const createOidClient = (oidcSettings) => {
    requiredConfigProperties.forEach((requiredProperty) => {
        if (!oidcSettings[requiredProperty]) {
            throw new Error("Required oidc setting " +
                requiredProperty +
                " missing for creating UserManager");
        }
    });
    return new OidcClient(oidcSettings);
};
export const addUserManagerEventListener = (oidcUserManager, eventName, eventListener) => {
    const addFnName = "add" + firstLetterUppercase(eventName);
    if (typeof oidcUserManager.events[addFnName] ===
        "function" &&
        typeof eventListener === "function") {
        oidcUserManager.events[addFnName](eventListener);
    }
};
export const removeUserManagerEventListener = (oidcUserManager, eventName, eventListener) => {
    const removeFnName = "remove" + firstLetterUppercase(eventName);
    if (typeof oidcUserManager.events[removeFnName] ===
        "function" &&
        typeof eventListener === "function") {
        oidcUserManager.events[removeFnName](eventListener);
    }
};
export const processSignInCallback = (oidcSettings) => {
    return new Promise((resolve, reject) => {
        const oidcUserManager = createUserManager(oidcSettings);
        oidcUserManager
            .signinRedirectCallback()
            .then((user) => {
            resolve(sessionStorage.getItem("pinia_oidc_active_route") || "/");
        })
            .catch((err) => {
            reject(err);
        });
    });
};
export const tokenExp = (token) => {
    if (token) {
        const parsed = parseJwt(token);
        return parsed.exp ? parsed.exp * 1000 : null;
    }
    return null;
};
export const tokenIsExpired = (token) => {
    const tokenExpiryTime = tokenExp(token);
    if (tokenExpiryTime) {
        return tokenExpiryTime < new Date().getTime();
    }
    return false;
};
//# sourceMappingURL=oidc-helpers.js.map