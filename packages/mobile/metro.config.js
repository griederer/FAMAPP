const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration for monorepo support
 */
const config = {
  projectRoot: __dirname,
  watchFolders: [
    // Include shared package for hot reloading
    path.resolve(__dirname, '../shared'),
    // Include root for workspace dependencies
    path.resolve(__dirname, '../..'),
  ],
  resolver: {
    alias: {
      '@famapp/shared': path.resolve(__dirname, '../shared/src'),
    },
    // Only include main fields for React Native
    resolverMainFields: ['react-native', 'browser', 'main'],
  },
  transformer: {
    // Enable platform-specific extensions
    platforms: ['ios', 'android', 'native', 'web'],
  },
};

module.exports = mergeConfig(defaultConfig, config);