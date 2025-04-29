const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: [
      // Images
      'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
      // Fonts
      'ttf', 'otf', 'woff', 'woff2',
      // Other
      'mp4', 'mp3', 'wav', 'webm', 'json'
    ],
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs'],
  },
  watchFolders: [
    `${__dirname}/assets`,
    `${__dirname}/src`
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config); 