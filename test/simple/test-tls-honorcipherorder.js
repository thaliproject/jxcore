// Copyright & License details are available under JXCORE_LICENSE file


var common = require('../common');
var assert = require('assert');
var tls = require('tls');
var fs = require('fs');
var nconns = 0;

// After disabling SSLv3 and TLSv1, the general purpose method SSLv23
// will choose the correct protocol.
var SSL_Method = 'SSLv23_method';
var localhost = '127.0.0.1';

process.on('exit', function() {
  assert.equal(nconns, 4);
});

function test(honorCipherOrder, clientCipher, expectedCipher, cb) {
  var soptions = {
    secureProtocol: SSL_Method,
    key: fs.readFileSync(common.fixturesDir + '/keys/agent2-key.pem'),
    cert: fs.readFileSync(common.fixturesDir + '/keys/agent2-cert.pem'),
    ciphers: 'AES256-SHA:RC4-SHA:AES128-SHA',
    honorCipherOrder: !!honorCipherOrder
  };

  var server = tls.createServer(soptions, function(cleartextStream) {
    nconns++;
  });
  server.listen(common.PORT, localhost, function() {
    var coptions = {
      rejectUnauthorized: false,
      secureProtocol: SSL_Method
    };
    if (clientCipher) {
      coptions.ciphers = clientCipher;
    }
    var client = tls.connect(common.PORT, localhost, coptions, function() {
      var cipher = client.getCipher();
      client.end();
      server.close();
      assert.equal(cipher.name, expectedCipher);
      if (cb) cb();
    });
  });
}

test1();

function test1() {
  // Client has the preference of cipher suites by default
  test(false, 'RC4-SHA:AES256-SHA:AES128-SHA','RC4-SHA', test2);
}

function test2() {
  // Server has the preference of cipher suites where AES256-SHA is in
  // the first.
  test(true, 'RC4-SHA:AES256-SHA:AES128-SHA', 'AES256-SHA', test3);
}

function test3() {
  // Server has the preference of cipher suites. AES256-SHA is given
  // higher priority over AES128-SHA among client cipher suites.
  test(true, 'RC4-SHA:AES256-SHA', 'AES256-SHA', test4);
}

function test4() {
  // As client has only one cipher, server has no choice in regardless
  // of honorCipherOrder.
  test(true, 'AES128-SHA', 'AES128-SHA');
}
