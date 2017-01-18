// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

// This test currently hangs on Windows
if (process.platform === 'win32') {
  console.error('Skipping: platform is Windows.');
  process.exit(0);
}

// Just test that destroying stdin doesn't mess up listening on a server.
// This is a regression test for GH-746.

var common = require('../common');
var assert = require('assert');
var net = require('net');

process.stdin.destroy();

var accepted = null;
var server = net.createServer(function(socket) {
  console.log('accepted');
  accepted = socket;
  socket.end();
  server.close();
});


server.listen(common.PORT, function() {
  console.log('listening...');

  net.createConnection(common.PORT);
});


process.on('exit', function() {
  assert.ok(accepted);
});