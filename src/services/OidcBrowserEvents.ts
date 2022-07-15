import { OidcUtils } from "..";

export const userManagerEventPrefix = 'OidcStore:'
export type UserManagerEvents = 'userLoaded' | 'userUnloaded' | 'accessTokenExpiring' | 
                                'accessTokenExpired' | 'silentRenewError' | 'userSignedOut'

export const OidcBrowserEvents = {
  // Use native custom event or DIY for IE
  CreateCustomEvent: (
    eventName: UserManagerEvents,
    detail: any,
    params: CustomEventInit<unknown> | undefined) => {
    const prefixedEventName = `${userManagerEventPrefix}:${eventName}`;

    if (typeof window.CustomEvent === "function") {
      params = OidcUtils.ObjectAssign([params, { detail: detail }]);
      return new window.CustomEvent(prefixedEventName, params);
    }
    const evt = new CustomEvent(prefixedEventName, { detail: detail });
    return evt;
  },
  DispatchCustomBrowserEvent: (
    eventName: UserManagerEvents,
    detail = {},
    params = {}) => {
    if (window) {
      const event = OidcBrowserEvents.CreateCustomEvent(
        eventName,
        OidcUtils.ObjectAssign([{}, detail]),
        params
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
  }
}