const assert = require("assert");
const sinon = require("sinon");
let piniaDispatchCustomBrowserEvent;

describe("browser-event.dispatchCustomBrowserEvent", function () {
  before(function () {
    piniaDispatchCustomBrowserEvent =
      require("../dist/pinia-oidc.cjs").piniaDispatchCustomBrowserEvent;
  });

  it("triggers an event on window", function () {
    const eventName = "testEvent";
    sinon.spy(window, "dispatchEvent");
    piniaDispatchCustomBrowserEvent(eventName);
    assert.equal(
      window.dispatchEvent.getCall(0).args[0].name,
      "OidcStore:" + eventName
    );
    window.dispatchEvent.restore();
  });
});
