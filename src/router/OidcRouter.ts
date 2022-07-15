import { Store } from "pinia";
import { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import {
  OidcHelpers,
  PiniaOidcStoreActions,
  PiniaOidcStoreGetters,
  PiniaOidcStoreState,
} from "..";

export const OidcRouter = {
  CreatePiniaRouterMiddleware: (
    store: Store<
      string,
      PiniaOidcStoreState,
      PiniaOidcStoreGetters,
      PiniaOidcStoreActions
    >
  ) => {
    return (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      store.oidcCheckAccess(to).then((hasAccess: boolean) => {
        if (hasAccess) {
          next();
        }
      });
    };
  },
  IsRoutePublic(
    route: RouteLocationNormalized,
    publicRoutePaths?: string[],
    isPublicRoute?: (route: RouteLocationNormalized) => boolean
  ) {
    if (route.meta && route.meta.isPublic) {
      return true;
    }
    if (
      route.meta &&
      Array.isArray(route.meta) &&
      route.meta.reduce((isPublic, meta) => meta.isPublic || isPublic, false)
    ) {
      return true;
    }
    if (
      publicRoutePaths &&
      publicRoutePaths
        .map((path: string) => path.replace(/\/$/, ""))
        .indexOf(route.path.replace(/\/$/, "")) > -1
    ) {
      return true;
    }
    if (isPublicRoute && typeof isPublicRoute === "function") {
      return isPublicRoute(route);
    }
    return false;
  },
  IsRouteOidcCallback(
    route: RouteLocationNormalized,
    routeBase?: string,
    redirect_uri?: string,
    popupRedirectUri?: string,
    silentRedirectUri?: string
  ) {
    if (route.meta && route.meta.isOidcCallback) {
      return true;
    }
    if (
      route.meta &&
      Array.isArray(route.meta) &&
      route.meta.reduce(
        (isOidcCallback, meta) => meta.isOidcCallback || isOidcCallback,
        false
      )
    ) {
      return true;
    }
    if (
      route.path &&
      route.path.replace(/\/$/, "") ===
        OidcHelpers.GetOidcCallbackPath(redirect_uri || "", routeBase || "")
    ) {
      return true;
    }
    if (
      route.path &&
      route.path.replace(/\/$/, "") === OidcHelpers.GetOidcCallbackPath(popupRedirectUri || "", routeBase || "")
    ) {
      return true;
    }
    if (
      route.path &&
      route.path.replace(/\/$/, "") === OidcHelpers.GetOidcCallbackPath(silentRedirectUri || "", routeBase || "")
    ) {
      return true;
    }
    return false;
  },
};
