import { ObjectIndexType } from './../src/services/OidcUtils';
import { expect } from 'chai';
import 'mocha';
import  { OidcUtils } from "../dist/store-oidc"
import { idToken } from "./id-token-test"


describe("utils.objectAssign", () => {
  it("should merge objects as a new object", () => {
    const objA = { prop1: 1, prop2: "a" };
    const objB = { prop1: 2, prop3: "b" };
    const merged:ObjectIndexType = OidcUtils.ObjectAssign([objA, objB]);
    expect(typeof merged).to.equal("object");
    expect(merged.prop1).to.equal(objB.prop1);
    expect(merged.prop2).to.equal(objA.prop2);
    expect(merged.prop3).to.equal(objB.prop3);
    objB.prop1 = 3;
    expect(merged.prop1).to.not.equal(objB.prop1);
  });
});

describe("utils.idToken", () => {
  it("Get a token", () => {
    const id_token:string = idToken;
    expect(id_token).to.equal("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vc2VydmVyLmV4YW1wbGUuY29tIiwic3ViIjoiMjQ4Mjg5NzYxMDAxIiwiYXVkIjoiczZCaGRSa3F0MyIsIm5vbmNlIjoibi0wUzZfV3pBMk1qIiwiZXhwIjoxODMwMjk3NjAwLCJpYXQiOjEzMTEyODA5NzAsIm5hbWUiOiJKYW5lIERvZSIsImdpdmVuX25hbWUiOiJKYW5lIiwiZmFtaWx5X25hbWUiOiJEb2UiLCJnZW5kZXIiOiJmZW1hbGUiLCJiaXJ0aGRhdGUiOiIwMDAwLTEwLTMxIiwiZW1haWwiOiJqYW5lZG9lQGV4YW1wbGUuY29tIiwicGljdHVyZSI6Imh0dHA6Ly9leGFtcGxlLmNvbS9qYW5lZG9lL21lLmpwZyIsImp0aSI6IjhiZTkzYTkwLWMwOGMtNDIzMC05YTUzLWM0MDA4YjVjZDIzOSJ9.9m0iXjjJT7t3LfmYBxYzK-A3LP_JUUGZTgntGTuzLwE");
  });

});

describe("utils.parseJwt", () => {
  it("parses a valid token", () => {
    const id_token:string = idToken;
    const parsed:ObjectIndexType = OidcUtils.ParseJwt(id_token);
    expect(parsed['email']).to.equal("janedoe@example.com");
  });
  it("returns an object when parsing an invalid token", () => {
    expect(typeof OidcUtils.ParseJwt("asd")).to.equal("object");
  });
});

describe("utils.firstLetterUppercase", () => {
  it("return a string with first letter uppercased", () => {
    expect(
      OidcUtils.FirstLetterUppercase("userLoaded")).to.equal("UserLoaded");
  });
});