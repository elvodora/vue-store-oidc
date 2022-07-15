const assert = require("assert");
const sinon = require("sinon");
let OidcStore;
let mockStore;
let mockNext;

describe("router-middleware", function () {
  before(function () {
    OidcStore = require("../dist/pinia-oidc.cjs");
    mockStore = {
      dispatch: function (action, to) {
        return new Promise(function (resolve) {
          resolve(true);
        });
      },
    };
    mockNext = sinon.spy();
  });

  it("calls next after dispatching check access action", function (done) {
    const routerMiddleware =
      OidcStore.OidcStoreCreateRouterMiddleware(mockStore);
    sinon.spy(mockNext);
    routerMiddleware({}, {}, mockNext);
    setTimeout(function () {
      assert.equal(mockNext.calledOnce, true);
      done();
    }, 10);
  });
});
