// Copyright & License details are available under JXCORE_LICENSE file

if (process.platform === 'ios') {
  console.error('Skipping: the test does not work on iOS');
  process.exit(0);
}

var fs = require('fs');
var net = require('net');
var path = require('path');
var assert = require('assert');
var common = require('../common');

var notSocketErrorFired = false;
var noEntErrorFired = false;
var accessErrorFired = false;

// Test if ENOTSOCK is fired when trying to connect to a file which is not
// a socket.
var emptyTxt = path.join(common.fixturesDir, 'empty.txt');
var notSocketClient = net.createConnection(emptyTxt, function() {
  assert.ok(false);
});

notSocketClient.on('error', function(err) {
  assert(err.code === 'ENOTSOCK' || err.code === 'ECONNREFUSED');
  notSocketErrorFired = true;
});


// Trying to connect to not-existing socket should result in ENOENT error
var noEntSocketClient = net.createConnection('no-ent-file', function() {
  assert.ok(false);
});

noEntSocketClient.on('error', function(err) {
  assert.equal(err.code, 'ENOENT');
  noEntErrorFired = true;
});


// On Windows or when running as root, a chmod has no effect on named pipes
if (process.platform !== 'win32' && process.getuid() !== 0) {
  // Trying to connect to a socket one has no access to should result in EACCES
  var accessServer = net.createServer(function() {
    assert.ok(false);
  });
  accessServer.listen(common.PIPE, function() {
    fs.chmodSync(common.PIPE, 0);

    var accessClient = net.createConnection(common.PIPE, function() {
      assert.ok(false);
    });

    accessClient.on('error', function(err) {
      assert.equal(err.code, 'EACCES');
      accessErrorFired = true;
      accessServer.close();
    });
  });
}


// Assert that all error events were fired
process.on('exit', function() {
  assert.ok(notSocketErrorFired);
  assert.ok(noEntErrorFired);
  if (process.platform !== 'win32' && process.getuid() !== 0) {
    assert.ok(accessErrorFired);
  }
});