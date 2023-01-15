
import { OIDC_BBROWSER_EVENT_PREFIX } from "../types";
import { OidcUtils } from "./OidcUtils";
/**
 * @category Constants
 */
export type OidcEvents =
  | "userLoaded"
  | "userUnloaded"
  | "accessTokenExpiring"
  | "accessTokenExpired"
  | "silentRenewError"
  | "userSignedOut";
/**
 * @category Static Classes
 */
export const OidcBrowserEvents = {
  // Use native custom event or DIY for IE
  CreateCustomEvent: (
    eventName: OidcEvents,
    detail: object,
    params: object
  ) => {
    const prefixedEventName = `${OIDC_BBROWSER_EVENT_PREFIX}:${eventName}`;

    if (typeof window.CustomEvent === "function") {
      params = OidcUtils.ObjectAssign([params, { detail: detail }]);
      return new window.CustomEvent(prefixedEventName, params);
    }
    const evt = new CustomEvent(prefixedEventName, { detail: detail });
    return evt;
  },
  DispatchCustomBrowserEvent: (
    eventName: OidcEvents,
    detail?: object,
    params?: object
  ) => {
    if (window) {
      const event = OidcBrowserEvents.CreateCustomEvent(
        eventName,
        detail || {},
        params || {}
      );
      window.dispatchEvent(event);
    }
  },
  OpenUrlWithIframe: (url: string) => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(
          new Error("gotoUrlWithIframe does not work when window is undefined")
        );
      }
      const iframe = window.document.createElement("iframe");
      iframe.style.display = "none";
      iframe.onload = () => {
        iframe.parentNode?.removeChild(iframe);
        resolve(true);
      };
      iframe.src = url;
      window.document.body.appendChild(iframe);
    });
  },
};
