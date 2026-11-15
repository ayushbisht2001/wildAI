const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [
      getDefaultConfig(__dirname).resolver.blockList,
      /\/\.android-sdk\/.*$/,
      /\/\.gradle-user-home\/.*$/,
      /\/android\/app\/build\/.*$/,
      /\/training\/output\/.*$/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
