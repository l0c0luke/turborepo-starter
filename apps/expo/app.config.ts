import type { ConfigContext, ExpoConfig } from "expo/config";

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
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: "your-google-ios-url-scheme",
        iosClientId: "your-google-ios-client-id",
        androidClientId: "your-google-android-client-id",
      },
    ],
  ],
});
