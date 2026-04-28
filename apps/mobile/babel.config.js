module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@evacuaid/shared': '../../packages/shared/src/index.ts',
            '@': './src',
          },
        },
      ],
    ],
  };
};
