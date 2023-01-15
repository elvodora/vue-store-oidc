import { ObjectIndexType } from "../src/services/OidcUtils";
import { expect } from "chai";
import "mocha";
import { OidcUtils } from "../dist/store-oidc";
import { idToken } from "./test-id-token";

describe("OidcUtils Static Class", () => {
  describe("ObjectAssign Method", () => {
    it("should merge objects as a new object", () => {
      const objA = { prop1: 1, prop2: "a" };
      const objB = { prop1: 2, prop3: "b" };
      const merged: ObjectIndexType = OidcUtils.ObjectAssign([objA, objB]);
      expect(typeof merged).to.equal("object");
      expect(merged.prop1).to.equal(objB.prop1);
      expect(merged.prop2).to.equal(objA.prop2);
      expect(merged.prop3).to.equal(objB.prop3);
      objB.prop1 = 3;
      expect(merged.prop1).to.not.equal(objB.prop1);
    });
  });

  describe("ParseJwt Method", () => {
    it("parses a valid token", () => {
      const id_token: string = idToken;
      const parsed: ObjectIndexType = OidcUtils.ParseJwt(id_token);
      expect(parsed["email"]).to.equal("janedoe@example.com");
    });
    it("returns an object when parsing an invalid token", () => {
      expect(typeof OidcUtils.ParseJwt("asd")).to.equal("object");
    });
  });

  describe("FirstLetterUppercase Method", () => {
    it("return a string with first letter uppercased", () => {
      expect(OidcUtils.FirstLetterUppercase("userLoaded")).to.equal(
        "UserLoaded"
      );
    });
  });
});
