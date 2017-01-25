// Copyright & License details are available under JXCORE_LICENSE file

if (process.platform === 'ios') {
  console.error('Skipping: the test does not work on iOS');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var net = require('net');

var address = null;

var server = net.createServer(function() {
  assert(false); // should not be called
});

server.listen(common.PIPE, function() {
  address = server.address();
  server.close();
});

process.on('exit', function() {
  assert.equal(address, common.PIPE);
});