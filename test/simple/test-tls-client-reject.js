// Copyright & License details are available under JXCORE_LICENSE file

if (process.platform === 'ios') {
  console.error('Skipping: the test is flaky on iOS');
  process.exit(0);
}

if (!process.versions.openssl) {
  console.error('Skipping: node compiled without OpenSSL.');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var tls = require('tls');
var fs = require('fs');
var path = require('path');

var options = {
  key: fs.readFileSync(path.join(common.fixturesDir, 'test_key.pem')),
  cert: fs.readFileSync(path.join(common.fixturesDir, 'test_cert.pem'))
};

var connectCount = 0;

var server = tls.createServer(options, function(socket) {
  ++connectCount;
  socket.on('data', function(data) {
    common.debug(data.toString());
    assert.equal(data, 'ok');
  });
}).listen(common.PORT, function() {
  unauthorized();
});

function unauthorized() {
  var socket = tls.connect({
    port: common.PORT,
    rejectUnauthorized: false
  }, function() {
    assert(!socket.authorized);
    socket.end();
    rejectUnauthorized();
  });
  socket.on('error', function(err) {
    assert(false);
  });
  socket.write('ok');
}

function rejectUnauthorized() {
  var socket = tls.connect(common.PORT, function() {
    assert(false);
  });
  socket.on('error', function(err) {
    common.debug('Expected error: ' + err);
    authorized();
  });
  socket.write('ng');
}

function authorized() {
  var socket = tls.connect(common.PORT, {
    ca: [fs.readFileSync(path.join(common.fixturesDir, 'test_cert.pem'))]
  }, function() {
    assert(socket.authorized);
    socket.end();
    server.close();
  });
  socket.on('error', function(err) {
    assert(false);
  });
  socket.write('ok');
}

process.on('exit', function() {
  assert.equal(connectCount, 3);
});