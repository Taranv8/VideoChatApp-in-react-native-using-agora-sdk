const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Create the base config
const config = mergeConfig(getDefaultConfig(__dirname), {
  /* your additional config options here if needed */
});

// Wrap it with NativeWind
module.exports = withNativeWind(config, {
  input: "./global.css"
});
