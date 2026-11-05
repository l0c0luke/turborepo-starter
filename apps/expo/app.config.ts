import type { ConfigContext, ExpoConfig } from "expo/config";

// Google sign-in is optional. Its config plugin validates the iOS URL scheme
// (the reversed iOS client ID, "com.googleusercontent.apps.…"), so it is only
// added once GOOGLE_IOS_URL_SCHEME is set — placeholder values would make
// `expo config` / `expo start` / prebuild fail. (Config files may read
// process.env; app code must use `~/env`.)
const googleIosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Example App",
  slug: "example-app",
  scheme: "example-app",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.svg",
  userInterfaceStyle: "automatic",
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.example.app",
    supportsTablet: true,
    entitlements: {
      "com.apple.developer.applesignin": ["Default"],
    },
  },
  android: {
    package: "com.example.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.svg",
      backgroundColor: "#3B82F6",
    },
  },
  extra: {
    eas: {
      projectId: "your-project-id-here",
    },
  },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "expo-apple-authentication",
    // SDK 57 moved the top-level `splash` config into this plugin.
    [
      "expo-splash-screen",
      {
        image: "./assets/splash.svg",
        resizeMode: "contain",
        backgroundColor: "#3B82F6",
      },
    ],
    ...(googleIosUrlScheme
      ? [
          [
            "@react-native-google-signin/google-signin",
            { iosUrlScheme: googleIosUrlScheme },
          ] satisfies [string, Record<string, string>],
        ]
      : []),
  ],
});
