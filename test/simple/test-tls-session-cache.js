// Copyright & License details are available under JXCORE_LICENSE file

if (!process.versions.openssl) {
  console.error('Skipping: node compiled without OpenSSL.');
  process.exit(0);
}
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

require('child_process').exec('openssl version', function(err) {
  if (err) {
    console.error('Skipping: openssl command is not available.');
    process.exit(0);
  }
  doTest();
});

function doTest() {
  var common = require('../common');
  var assert = require('assert');
  var tls = require('tls');
  var fs = require('fs');
  var join = require('path').join;
  var spawn = require('child_process').spawn;

  var keyFile = join(common.fixturesDir, 'agent.key');
  var certFile = join(common.fixturesDir, 'agent.crt');
  var key = fs.readFileSync(keyFile);
  var cert = fs.readFileSync(certFile);
  var options = {
    key: key,
    cert: cert,
    ca: [cert],
    requestCert: true
  };
  var requestCount = 0;
  var session;
  var badOpenSSL = false;

  var server = tls.createServer(options, function(cleartext) {
    cleartext.on('error', function(er) {
      // We're ok with getting ECONNRESET in this test, but it's
      // timing-dependent, and thus unreliable. Any other errors
      // are just failures, though.
      if (er.code !== 'ECONNRESET')
        throw er;
    });
    ++requestCount;
    cleartext.end();
  });
  server.on('newSession', function(id, data) {
    assert.ok(!session);
    session = {
      id: id,
      data: data
    };
  });
  server.on('resumeSession', function(id, callback) {
    assert.ok(session);
    assert.equal(session.id.toString('hex'), id.toString('hex'));

    // Just to check that async really works there
    setTimeout(function() {
      callback(null, session.data);
    }, 100);
  });
  server.listen(common.PORT, function() {
    var client = spawn('openssl', [
      's_client',
      '-connect', 'localhost:' + common.PORT,
      '-key', join(common.fixturesDir, 'agent.key'),
      '-cert', join(common.fixturesDir, 'agent.crt'),
      '-reconnect',
      '-no_ticket'
    ], {
      stdio: [ 0, 1, 'pipe' ]
    });
    var err = '';
    client.stderr.setEncoding('utf8');
    client.stderr.on('data', function(chunk) {
      err += chunk;
    });
    client.on('exit', function(code) {
      if (/^unknown option/.test(err) || /handshake failure/.test(err)) {
        // using an incompatible or too old version of openssl
        badOpenSSL = true;
        console.error(err);
      } else
        assert.equal(code, 0);
      server.close();
    });
  });

  process.on('exit', function() {
    if (badOpenSSL) {
      console.error('Skipping: incompatible or too old version of OpenSSL');
    } else {
      assert.ok(session);

      // initial request + reconnect requests (5 times)
      assert.equal(requestCount, 6);
    }
  });
}