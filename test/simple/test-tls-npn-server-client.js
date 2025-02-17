// Copyright & License details are available under JXCORE_LICENSE file

if (!process.features.tls_npn) {
  console.error('Skipping: node compiled without OpenSSL or ' +
                'with old OpenSSL version.');
  process.exit(0);
}

var common = require('../common'),
    assert = require('assert'),
    fs = require('fs'),
    tls = require('tls'),
    crypto = require('crypto');

function filenamePEM(n) {
  return require('path').join(common.fixturesDir, 'keys', n + '.pem');
}

function loadPEM(n) {
  return fs.readFileSync(filenamePEM(n));
}

var serverOptions = {
  key: loadPEM('agent2-key'),
  cert: loadPEM('agent2-cert'),
  crl: loadPEM('ca2-crl'),
  SNICallback: function() {
    return crypto.createCredentials({
      key: loadPEM('agent2-key'),
      cert: loadPEM('agent2-cert'),
      crl: loadPEM('ca2-crl'),
    }).context;
  },
  NPNProtocols: ['a', 'b', 'c']
};

var serverPort = common.PORT;

var clientsOptions = [{
  port: serverPort,
  key: serverOptions.key,
  cert: serverOptions.cert,
  crl: serverOptions.crl,
  NPNProtocols: ['a', 'b', 'c'],
  rejectUnauthorized: false
},{
  port: serverPort,
  key: serverOptions.key,
  cert: serverOptions.cert,
  crl: serverOptions.crl,
  NPNProtocols: ['c', 'b', 'e'],
  rejectUnauthorized: false
},{
  port: serverPort,
  key: serverOptions.key,
  cert: serverOptions.cert,
  crl: serverOptions.crl,
  rejectUnauthorized: false
},{
  port: serverPort,
  key: serverOptions.key,
  cert: serverOptions.cert,
  crl: serverOptions.crl,
  NPNProtocols: ['first-priority-unsupported', 'x', 'y'],
  rejectUnauthorized: false
}];

var serverResults = [],
    clientsResults = [];

var server = tls.createServer(serverOptions, function(c) {
  serverResults.push(c.npnProtocol);
});
server.listen(serverPort, startTest);

function startTest() {
  function connectClient(options, callback) {
    var client = tls.connect(options, function() {
      clientsResults.push(client.npnProtocol);
      client.destroy();

      callback();
    });
  };

  connectClient(clientsOptions[0], function() {
    connectClient(clientsOptions[1], function() {
      connectClient(clientsOptions[2], function() {
        connectClient(clientsOptions[3], function() {
          server.close();
        });
      });
    });
  });
}

process.on('exit', function() {
  assert.equal(serverResults[0], clientsResults[0]);
  assert.equal(serverResults[1], clientsResults[1]);
  assert.equal(serverResults[2], 'http/1.1');
  assert.equal(clientsResults[2], false);
  assert.equal(serverResults[3], 'first-priority-unsupported');
  assert.equal(clientsResults[3], false);
});