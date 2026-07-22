const env = process.env;

// Must match the "Web client" OAuth client ID the mobile app configures
// via GoogleSignin.configure({ webClientId }) - the backend verifies the
// idToken's audience against this value.
export const googleConfig = {
  webClientId:
    env.GOOGLE_WEB_CLIENT_ID ||
    "589315048644-t9t9g15pipph86d3m4rk68b9pt4kithh.apps.googleusercontent.com",
};
