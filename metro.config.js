const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /backend\/.*/,
  /node_modules\/.*\/node_modules\/fbjs.*/
];

module.exports = config;
