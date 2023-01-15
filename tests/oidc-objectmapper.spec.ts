import { expect } from "chai";
import "mocha";
import {
  OidcObjectMapper,
  OidcStoreOidcClientSettings,
} from "../dist/store-oidc";
import { OidcClientSettings } from "oidc-client-ts";

describe("OidcObjectMapper Static Class", () => {
  describe("ObjectAssign Method", () => {
    it("should map data from OidcStoreOidcClientSettings to OidcClientSettings", () => {
      const oidcStoreOidcClientSettings: OidcStoreOidcClientSettings = {
        authority: "https://amc-cms.azurewebsites.net/",
        client_id:
          "459300396575-3ruj8l8jn69pcgst8rgkqnk6g43gbc78.amc-cms.azurewebsites.net",
        redirect_uri: "http://localhost:5002/oidc-callback",
      };
      let oidcClientSettings: OidcClientSettings =
        OidcObjectMapper.OidcStoreOidcClientSettings_To_OidcClientSettings(
          oidcStoreOidcClientSettings
        );
      expect(typeof oidcClientSettings).to.equal("object");
      expect(oidcClientSettings.authority).to.equal(
        oidcStoreOidcClientSettings.authority
      );
      expect(oidcClientSettings.client_id).to.equal(
        oidcStoreOidcClientSettings.client_id
      );
      expect(oidcClientSettings.redirect_uri).to.equal(
        oidcStoreOidcClientSettings.redirect_uri
      );
      oidcStoreOidcClientSettings.authority =
        "https://amc-cms.azurewebsites.net/connect";
      expect(oidcStoreOidcClientSettings.authority).to.not.equal(
        oidcClientSettings.authority
      );
      oidcClientSettings =
        OidcObjectMapper.OidcStoreOidcClientSettings_To_OidcClientSettings(
          oidcStoreOidcClientSettings
        );
      expect(oidcStoreOidcClientSettings.authority).to.equal(
        oidcClientSettings.authority
      );
    });
  });
});
