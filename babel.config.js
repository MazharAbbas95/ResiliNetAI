module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@agents': './src/agents',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@navigation': './src/navigation',
            '@appTypes': './src/types',
            '@theme': './src/theme',
            '@config': './src/config',
            '@infraFirebase': './src/infra_firebase',
            '@utils': './src/utils',
            '@assets': './assets',
          },
        },
      ],
    ],
  };
};
