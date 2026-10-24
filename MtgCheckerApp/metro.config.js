const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Keep Metro scoped to this app folder (faster watch on Windows).
config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [require('path').resolve(__dirname, 'node_modules')];

module.exports = config;
