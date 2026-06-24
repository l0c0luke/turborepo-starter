/** @type {import("@babel/core").ConfigFunction} */
module.exports = (api) => {
  api.cache(true);
  return {
    // NativeWind v5 configures its Babel plugin via metro.config.js, so this
    // stays minimal. react-native-worklets/plugin must stay last (Reanimated 4).
    presets: ["babel-preset-expo"],
    plugins: ["react-native-worklets/plugin"],
  };
};
