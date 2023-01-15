import * as chai from "chai";
import "mocha";
import * as spies from "chai-spies";
import { OidcRouter } from "../dist/store-oidc";

import { RouteLocationNormalized } from "vue-router";

const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

describe("OidcRouter Static Class", () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe("IsPublic Method", () => {
    it("returned true for a home route contained in publicRoutePaths array", () => {
      expect(OidcRouter.IsRoutePublic(homeRoute, ["/"])).to.equal(true);
    });
    it("returned true for a public route with meta.isPublic = true", () => {
      expect(OidcRouter.IsRoutePublic(publicRoute)).to.equal(true);
    });
    it("returned false for a not public route with empty meta", () => {
      expect(OidcRouter.IsRoutePublic(notPublicRoute)).to.equal(false);
    });
    it("returned true for a not public route with isPublicRoute callback returning true", () => {
      expect(
        OidcRouter.IsRoutePublic(notPublicRoute, [], routeIsPublic)
      ).to.equal(true);
    });
  });
  describe("IsRouteOidcCallback Method", () => {
    it("returned true for a route with meta.isOidcCallback = true", () => {
      expect(OidcRouter.IsRouteOidcCallback(oidcCallbackRoute)).to.equal(true);
    });
    it("returned true for a route with path = /oidc-callback", () => {
      expect(OidcRouter.IsRouteOidcCallback(oidcCallbackRedirectRoute, "/" ,oidcCalbackRedirectPath)).to.equal(true);
    });
  });
});

const publicRoute: RouteLocationNormalized = {
  matched: [],
  path: "/",
  fullPath: "/",
  hash: "",
  name: "home",
  redirectedFrom: undefined,
  query: {},
  params: {},
  meta: { isPublic: true },
};

const homeRoute: RouteLocationNormalized = {
  matched: [],
  path: "/",
  fullPath: "/",
  hash: "",
  name: "home",
  redirectedFrom: undefined,
  query: {},
  params: {},
  meta: { isPublic: true },
};

const notPublicRoute: RouteLocationNormalized = {
  matched: [],
  path: "/admin",
  fullPath: "/admin",
  hash: "",
  name: "admin",
  redirectedFrom: undefined,
  query: {},
  params: {},
  meta: {},
};

const oidcCallbackRedirectRoute: RouteLocationNormalized = {
  matched: [],
  path: "/oidc-callback",
  fullPath: "/oidc-callback",
  hash: "",
  name: "oidc-callback",
  redirectedFrom: undefined,
  query: {},
  params: {},
  meta: { },
};

const oidcCallbackRoute: RouteLocationNormalized = {
  matched: [],
  path: "/admi",
  fullPath: "/admin",
  hash: "",
  name: "admin",
  redirectedFrom: undefined,
  query: {},
  params: {},
  meta: { isOidcCallback: true },
};

const routeIsPublic = () => true;
const oidcCalbackRedirectPath = 'http://localhost:1337/oidc-callback/';
