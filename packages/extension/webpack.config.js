const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      background: './src/background.ts',
      content: './src/content.ts',
      popup: './src/popup.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/manifest.json',
            to: 'manifest.json'
          },
          {
            from: 'src/popup.html',
            to: 'popup.html'
          },
          {
            from: 'src/popup.css',
            to: 'popup.css'
          },
          {
            from: 'src/content.css',
            to: 'content.css'
          },
          {
            from: 'src/icons',
            to: 'icons',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    optimization: {
      minimize: isProduction
    },
    devtool: isProduction ? false : 'cheap-module-source-map',
    target: 'web'
  };
};