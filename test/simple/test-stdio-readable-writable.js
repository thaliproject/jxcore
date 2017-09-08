// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}
var common = require('../common');
var assert = require('assert');

assert(process.stdout.writable);
assert(!process.stdout.readable);

assert(process.stderr.writable);
assert(!process.stderr.readable);

assert(!process.stdin.writable);
assert(process.stdin.readable);