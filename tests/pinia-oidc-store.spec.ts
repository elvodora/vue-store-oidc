import * as chai from "chai";
import "mocha";
import * as spies from "chai-spies";
import { PiniaOidcStore } from "../dist/store-oidc";
import { oidcTestConfig } from "./test-oidc-config";
import { RouteLocationNormalized } from "vue-router";

const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();
let piniaOidcStore: PiniaOidcStore;

describe("PiniaOidcStore Class", () => {
  beforeEach(() => {
    piniaOidcStore = new PiniaOidcStore(oidcTestConfig, {
      dispatchEventsOnWindow: true,
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe("PiniaOidcStore constructor", () => {
    it("returned instance of the PiniaOidcStore is object", () => {
      expect(typeof piniaOidcStore).to.equal("object");
    });
    it("returned Actions of the PiniaOidcStore is object", () => {
      expect(typeof piniaOidcStore.Actions).to.equal("object");
    });
    it("returned State of the PiniaOidcStore is object", () => {
      expect(typeof piniaOidcStore.State).to.equal("object");
    });
    it("returned Mutations of the PiniaOidcStore throw error 'Method not implemented'", () => {
      expect(() => piniaOidcStore.Mutations).to.throw("Method not implemented");
    });
    it("returned Getters of the PiniaOidcStore is object", () => {
      expect(typeof piniaOidcStore.Getters).to.equal("object");
    });
  });
  describe("Actions.OidcCheckAccess action function of the PiniaOidcStore", function () {
    this.timeout(10000);
    it("should resolve true for public routes if authenticated", (done) => {
      piniaOidcStore.Actions.oidcCheckAccess(publicRoute)
        .then((hasAccess) => {
          expect(hasAccess).equal(true);
          done();
        })
        .catch((err) => done(err));
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
