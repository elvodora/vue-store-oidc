import * as chai from "chai";
import "mocha";
import * as spies from "chai-spies";
import { OidcBrowserEvents } from "../dist/store-oidc";

const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();
describe("OidcBrowserEvents Static Class", () => {
  beforeEach(() => {
    //sandbox.on(window, "dispatchEvent", (...params) => console.log(...params));
    sandbox.on(window, "dispatchEvent");
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe("DispatchCustomBrowserEvent Method", () => {
    it("triggers an event on window", () => {
      const eventName = "userLoaded";
      OidcBrowserEvents.DispatchCustomBrowserEvent(eventName);
      expect(window.dispatchEvent).to.have.been.called();
    });
  });
});
