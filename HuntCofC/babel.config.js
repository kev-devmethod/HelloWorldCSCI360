module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@': '.',
            '@constants': './app/constants',
            '@components': './app/components'
          }
        }
      ]
    ]
  };
};