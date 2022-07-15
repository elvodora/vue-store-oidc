import { expect } from 'chai';
import 'mocha';
import  { objectAssign, parseJwt, firstLetterUppercase } from "../dist/store-oidc"
import idToken from "./id-token-2028-01-01"

describe("utils.objectAssign", () => {
  it("should merge objects as a new object", () => {
    const objA = { prop1: 1, prop2: "a" };
    const objB = { prop1: 2, prop3: "b" };
    const merged = objectAssign([objA, objB]);
    expect(typeof merged).to.equal("object");
    expect(merged.prop1).to.equal(objB.prop1);
    expect(merged.prop2).to.equal(objA.prop2);
    expect(merged.prop3).to.equal(objB.prop3);
    objB.prop1 = 3;
    expect(merged.prop1).to.not.equal(objB.prop1);
  });
});

describe("utils.parseJwt", () => {
  it("parses a valid token", () => {
    const parsed = parseJwt(idToken);
    expect(parsed.email).to.equal("janedoe@example.com");
  });
  it("parses a an object when parsing an invalid token", () => {
    expect(typeof parseJwt("asd")).to.equal("object");
    //expect(typeof parseJwt(null)).to.equal("object");
  });
});

describe("utils.firstLetterUppercase", () => {
  it("return a string with first letter uppercased", () => {
    expect(
      firstLetterUppercase("userLoaded")).to.equal("UserLoaded");
  });
});