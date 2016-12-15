// Copyright & License details are available under JXCORE_LICENSE file

// We will skip this test in embedded mode because it uses the 
// __defineGetter_ method that uses the TTY lib that doesn't work
// in embedded mode.

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common'),
    assert = require('assert'),
    repl = require('repl');

// https://github.com/joyent/node/issues/3226

require.cache.something = 1;
assert.equal(require.cache.something, 1);

repl.start({ useGlobal: false }).rli.close();

assert.equal(require.cache.something, 1);