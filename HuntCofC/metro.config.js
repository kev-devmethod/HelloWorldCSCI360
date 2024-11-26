const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  projectRoot: __dirname,
  watchFolders: [path.resolve(__dirname, '..')],
  resolver: {
    ...defaultConfig.resolver,
    nodeModulesPaths: [path.resolve(__dirname, '..', 'node_modules')],
    assetExts: [...defaultConfig.resolver.assetExts],
  },
  transformer: {
    ...defaultConfig.transformer,
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  }
}; 