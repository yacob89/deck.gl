// NOTE: To use this example standalone (e.g. outside of deck.gl repo)
// delete the local development overrides at the bottom of this file

// avoid destructuring for older Node version support
const resolve = require('path').resolve;

module.exports = {
  entry: resolve('./app'),

  devtool: 'source-map',

  module: {
    rules: [
      {
        // Compile ES2015 using buble
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env', 'react', 'stage-2'].map(n => require.resolve(`babel-preset-${n}`))
          }
        }
      }
    ]
  },

  plugins: []
};
