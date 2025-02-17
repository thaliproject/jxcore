// Copyright & License details are available under JXCORE_LICENSE file

if (!process.versions.openssl) {
  console.error('Skipping: node compiled without OpenSSL.');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var net = require('net');
var tls = require('tls');
var fs = require('fs');

var clientErrors = 0;

process.on('exit', function() {
  assert.equal(clientErrors, 1);
});

var options = {
  key: fs.readFileSync(common.fixturesDir + '/keys/agent1-key.pem'),
  cert: fs.readFileSync(common.fixturesDir + '/keys/agent1-cert.pem'),
  handshakeTimeout: 50
};

var server = tls.createServer(options, assert.fail);

server.on('clientError', function(err, conn) {
  conn.destroy();
  server.close();
  clientErrors++;
});

server.listen(common.PORT, function() {
  net.connect({ host: '127.0.0.1', port: common.PORT });
});