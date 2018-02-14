// Enables ES2015 import/export in Node.js
require('reify');

// Registers an alias for this module
const path = require('path');
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@deck.gl/core', path.resolve('../core/src'));
moduleAlias.addAlias('@deck.gl/test-utils', path.resolve('./src'));
moduleAlias.addAlias('@deck.gl/test-utils/test', path.resolve('./test'));

require('babel-polyfill');
