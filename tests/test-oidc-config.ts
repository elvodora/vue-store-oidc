export const oidcTestConfig = {
    authority: 'https://accounts.google.com/o/oauth2/auth',
    client_id: '264896171845-lgsk72hi9sp3m849o1ha193383ed183q.apps.googleusercontent.com',
    redirect_uri: 'http://localhost:1337/oidc-callback',
    silent_redirect_uri: 'http://localhost:1337/oidc-silent-callback',
    automaticSilentRenew: true,
    scope: 'openid profile'
  }