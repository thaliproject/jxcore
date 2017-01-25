// Copyright & License details are available under JXCORE_LICENSE file

if (process.platform === 'ios') {
  console.error('Skipping: the test does not work on iOS');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');

var net = require('net');
var closed = false;

var s = net.Server();
s.listen(common.PIPE);
s.unref();

setTimeout(function() {
  closed = true;
  s.close();
}, 1000).unref();

process.on('exit', function() {
  assert.strictEqual(closed, false, 'Unrefd socket should not hold loop open');
});