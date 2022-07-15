import sinon from "sinon";
import { expect } from 'chai';
import 'mocha';
import  OidcStore from "../dist/store-oidc"

let mockStore;
let mockNext;

describe("router-middleware", () => {
  before(function () {
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
      OidcStore.createRouterMiddleware(mockStore);
    sinon.spy(mockNext);
    routerMiddleware(null, null, mockNext);
    setTimeout(function () {
      expect(true).to.equal(mockNext.calledOnce);
      done();
    }, 10);
  });
});
