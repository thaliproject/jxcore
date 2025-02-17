// Copyright & License details are available under JXCORE_LICENSE file


var common = require('../common');
var assert = require('assert');
var tls = require('tls');
var fs = require('fs');
var nconns = 0;
var SSL_Method = 'SSLv23_method';
var localhost = '127.0.0.1';
var opCipher = process.binding('constants').SSL_OP_CIPHER_SERVER_PREFERENCE;

/*
 * This test is to make sure we are preserving secureOptions that are passed
 * to the server.
 *
 * Also that if honorCipherOrder is passed we are preserving that in the
 * options.
 *
 * And that if we are passing in secureOptions no new options (aside from the
 * honorCipherOrder case) are added to the secureOptions
 */


process.on('exit', function() {
  assert.equal(nconns, 6);
});

function test(honorCipherOrder, clientCipher, expectedCipher, secureOptions, cb) {
  var soptions = {
    secureProtocol: SSL_Method,
    key: fs.readFileSync(common.fixturesDir + '/keys/agent2-key.pem'),
    cert: fs.readFileSync(common.fixturesDir + '/keys/agent2-cert.pem'),
    ciphers: 'AES256-SHA:RC4-SHA:AES128-SHA',
    secureOptions: secureOptions,
    honorCipherOrder: !!honorCipherOrder
  };

  var server = tls.createServer(soptions, function(cleartextStream) {
    nconns++;
  });

  if (!!honorCipherOrder) {
    assert.strictEqual(server.secureOptions & opCipher, opCipher, 'we should preserve cipher preference');
  }

  if (secureOptions) {
    var expectedSecureOpts = secureOptions;
    if (!!honorCipherOrder) expectedSecureOpts |= opCipher;

    assert.strictEqual(server.secureOptions & expectedSecureOpts,
                       expectedSecureOpts, 'we should preserve secureOptions');
    assert.strictEqual((server.secureOptions & secureOptions) & ~expectedSecureOpts,
                       0,
                       'we should not add extra options');
  }

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
  test(false, 'RC4-SHA:AES256-SHA:AES128-SHA','RC4-SHA', 0, test2);
}

function test2() {
  // Server has the preference of cipher suites where AES256-SHA is in
  // the first.
  test(true, 'RC4-SHA:AES256-SHA:AES128-SHA', 'AES256-SHA', 0, test3);
}

function test3() {
  // Server has the preference of cipher suites. AES256-SHA is given
  // higher priority over RC4-SHA among client cipher suites.
  test(true, 'RC4-SHA:AES256-SHA', 'AES256-SHA', 0, test4);
}

function test4() {
  // As client has only one cipher, server has no choice in regardless
  // of honorCipherOrder.
  test(true, 'AES128-SHA', 'AES128-SHA', 0, test5);
}

function test5() {
  test(false,
       'RC4-SHA',
       'RC4-SHA',
       process.binding('constants').SSL_OP_SINGLE_DH_USE, test6);
}

function test6() {
  test(true,
       'RC4-SHA',
       'RC4-SHA',
       process.binding('constants').SSL_OP_SINGLE_DH_USE);
}
