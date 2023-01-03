import { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { OidcStoreMembers } from "..";

const _getOidcCallbackPath = (callbackUri: string, routeBase = "/") => {
  if (callbackUri) {
    const domainStartsAt = "://";
    const hostAndPath = callbackUri.substring(
      callbackUri.indexOf(domainStartsAt) + domainStartsAt.length
    );
    return hostAndPath
      .substring(hostAndPath.indexOf(routeBase) + routeBase.length - 1)
      .replace(/\/$/, "");
  }
  return null;
};

/**
 * OidcRouter - static class (object) helper to define Vue Router Middleware methods (functions).
 * @category Static Classes
 */
export const OidcRouter = {
  /**
 * Create Router middleware for Pinia Store .
 *
 * 
 * ```ts
 *const app = createApp(App);
 *const pinia = createPinia();
 *app.use(pinia);
 *
 *const store = useOidcStore();
 *router.beforeEach(OidcRouter.CreatePiniaRouterMiddleware(store));
 *
 *app.use(router);
 * ```
 *
 *
 * @param store Pinia OidcStore.
 * @returns Router Middleware function for managing Authentication and Authorization by OidcStore.
 */
  CreatePiniaRouterMiddleware: (store: OidcStoreMembers) => {
    return (
      to: RouteLocationNormalized,
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
        _getOidcCallbackPath(redirect_uri || "", routeBase || "")
    ) {
      return true;
    }
    if (
      route.path &&
      route.path.replace(/\/$/, "") ===
        _getOidcCallbackPath(popupRedirectUri || "", routeBase || "")
    ) {
      return true;
    }
    if (
      route.path &&
      route.path.replace(/\/$/, "") ===
        _getOidcCallbackPath(silentRedirectUri || "", routeBase || "")
    ) {
      return true;
    }
    return false;
  },
};
