const {resolve} = require('path');
const webpack = require('webpack');

const LIBRARY_BUNDLE_CONFIG = {
  // Bundle the source code
  entry: {
    lib: resolve('./src/index.js')
  },

  // Silence warnings about big bundles
  stats: {
    warnings: false
  },

  output: {
    // Generate the bundle in dist folder
    path: resolve('./dist'),
    filename: '[name]-bundle.js',
    library: 'deck.gl',
    libraryTarget: 'umd'
  },

  // Exclude any non-relative imports from resulting bundle
  externals: [
    /^[a-z\.\-0-9]+$/
  ],

  module: {
    rules: [
      {
        // Inline shaders
        test: /\.glsl$/,
        exclude: /node_modules/,
        loader(content) {
          this.cacheable && this.cacheable(); // eslint-disable-line
          this.value = content;
          return "module.exports = " + JSON.stringify(content); // eslint-disable-line
        }
      }
    ]
  },

  node: {
    fs: 'empty'
  },

  plugins: [
    // leave minification to app
    // new webpack.optimize.UglifyJsPlugin({comments: false})
    new webpack.DefinePlugin({
      DECK_VERSION: JSON.stringify(require('./package.json').version)
    })
  ]
};

const BROWSER_CONFIG = {
  devServer: {
    stats: {
      warnings: false
    },
    quiet: true
  },

  // Generate a bundle in dist folder
  output: {
    path: resolve('./dist'),
    filename: '[name]-bundle.js'
  },

  resolve: {
    alias: {
      'deck.gl/test': resolve('./test'),
      'deck.gl/dist': resolve('./src'),
      'deck.gl': resolve('./src'),
      'deck.gl-layers': resolve('./src/experimental-layers/src'),
      '@deck.gl/test-utils': resolve('./src/test-utils/src')
    }
  },

  devtool: '#inline-source-maps',

  module: {
    rules: [
      {
        // Unfortunately, webpack doesn't import library sourcemaps on its own...
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      }
    ]
  },

  node: {
    fs: 'empty'
  },

  plugins: []
};

const WEBPACK_ENVS = {
  // Bundle the standard unit tests for running in the browser
  'test': Object.assign({}, BROWSER_CONFIG, {
    entry: {
      'test-browser': resolve('./test/browser.js')
    }
  }),

  // Bundle the render tests for running in the browser
  'render': Object.assign({}, BROWSER_CONFIG, {
    entry: {
      'test-browser': resolve('.(/test/render/test-r)endering.js')
    }
  }),

  // Bundle the react render tests for running in the browser
  'render-react': Object.assign({}, BROWSER_CONFIG, {
    entry: {
      'test-browser': resolve('./test/render/old/test-rendering.react.js')
    }
  }),

  // Bundle the benchmark tests for running in the browser
  'bench': Object.assign({}, BROWSER_CONFIG, {
    entry: {
      'test-browser': resolve('./test/bench/browser.js')
    }
  }),

  // Bundle a "library"
  'library': LIBRARY_BUNDLE_CONFIG
};

module.exports = env => {
  env = env || {};
  if (env.test) {
    return WEBPACK_ENVS.test;
  }
  if (env.render) {
    return WEBPACK_ENVS.render;
  }
  if (env['render-react']) {
    return WEBPACK_ENVS['render-react'];
  }
  if (env.bench) {
    return WEBPACK_ENVS.bench;
  }
  return WEBPACK_ENVS.library;
};
