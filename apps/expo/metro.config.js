const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable package exports for better-auth
config.resolver.unstable_enablePackageExports = true;

// NativeWind v5 compiles the CSS imported in app code (see src/app/_layout.tsx →
// `import "../global.css"`) and configures the Babel plugin. `globalClassNamePolyfill`
// makes `className` work on built-in RN primitives (View, Text, …); set it false and
// use per-component `cssInterop` if you'd rather opt in for performance.
module.exports = withNativewind(config, { globalClassNamePolyfill: true });
