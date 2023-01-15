export interface OidcStoreOidcClientSettings {
    /** The URL of the OIDC/OAuth2 provider */
    authority: string;
    metadataUrl?: string;
    /** Your client application's identifier as registered with the OIDC/OAuth2 */
    client_id: string;
    client_secret?: string;
    /** The type of response desired from the OIDC/OAuth2 provider (default: "code") */
    response_type?: string;
    /** The scope being requested from the OIDC/OAuth2 provider (default: "openid") */
    scope?: string;
    /** The redirect URI of your client application to receive a response from the OIDC/OAuth2 provider */
    redirect_uri: string;
    /** The OIDC/OAuth2 post-logout redirect URI */
    post_logout_redirect_uri?: string;
    /**
     * Client authentication method that is used to authenticate when using the token endpoint (default: "client_secret_post")
     * - "client_secret_basic": using the HTTP Basic authentication scheme
     * - "client_secret_post": including the client credentials in the request body
     *
     * See https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
     */
    client_authentication?: "client_secret_basic" | "client_secret_post";
    /** optional protocol param */
    prompt?: string;
    /** optional protocol param */
    display?: string;
    /** optional protocol param */
    max_age?: number;
    /** optional protocol param */
    ui_locales?: string;
    /** optional protocol param */
    acr_values?: string;
    /** optional protocol param */
    resource?: string;
    /** optional protocol param (default: "query") */
    response_mode?: "query" | "fragment";
    /** Should OIDC protocol claims be removed from profile (default: true) */
    filterProtocolClaims?: boolean;
    /** Flag to control if additional identity data is loaded from the user info endpoint in order to populate the user's profile (default: false) */
    loadUserInfo?: boolean;
    /** Number (in seconds) indicating the age of state entries in storage for authorize requests that are considered abandoned and thus can be cleaned up (default: 300) */
    staleStateAgeInSeconds?: number;
    /** The window of time (in seconds) to allow the current time to deviate when validating token's iat, nbf, and exp values (default: 300) */
    clockSkewInSeconds?: number;
    userInfoJwtIssuer?: "ANY" | "OP" | string;
    /**
     * Indicates if objects returned from the user info endpoint as claims (e.g. `address`) are merged into the claims from the id token as a single object.
     * Otherwise, they are added to an array as distinct objects for the claim type. (default: false)
     */
    mergeClaims?: boolean;
     /**
     * An object containing additional query string parameters to be including in the authorization request.
     * E.g, when using Azure AD to obtain an access token an additional resource parameter is required. extraQueryParams: `{resource:"some_identifier"}`
     */
    extraQueryParams?: Record<string, string | number | boolean>;
    extraTokenParams?: Record<string, unknown>;
    //
    loginHint?: string;
    popupRedirectUri?: string;
    silentRedirectUri?: string;
    automaticSilentRenew?: boolean;
    automaticSilentSignin?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}
