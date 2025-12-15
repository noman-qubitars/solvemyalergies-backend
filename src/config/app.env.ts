const env = process.env;

export const appConfig = {
  playStoreUrl: env.PLAY_STORE_URL || "https://play.google.com/store/apps",
  appStoreUrl: env.APP_STORE_URL || "https://apps.apple.com/app",
};

