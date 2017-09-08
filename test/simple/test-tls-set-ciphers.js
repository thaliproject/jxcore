// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var exec = require('child_process').exec;
var tls = require('tls');
var fs = require('fs');
var openssl_ok = true;

exec('openssl version', function(err, stdout, stderr) {
  if (err) {
    openssl_ok = false;
    console.error('Skipping: openssl command is not available.');
    process.exit(0);
  }
});

var options = {
  key: fs.readFileSync(common.fixturesDir + '/keys/agent2-key.pem'),
  cert: fs.readFileSync(common.fixturesDir + '/keys/agent2-cert.pem'),
  ciphers: 'RC4-MD5'
};

var reply = 'I AM THE WALRUS'; // something recognizable
var nconns = 0;
var response = '';
var badOpenSSL = false;

process.on('exit', function() {
  if (openssl_ok) {
    assert.equal(nconns, 1);
    assert.notEqual(response.indexOf(reply), -1);
  }
});

var server = tls.createServer(options, function(conn) {
  conn.end(reply);
  nconns++;
});

server.listen(common.PORT, '127.0.0.1', function() {
  var cmd = 'openssl s_client -cipher ' + options.ciphers +
            ' -connect 127.0.0.1:' + common.PORT;

  exec(cmd, function(err, stdout, stderr) {
    if (err) throw err;
    if (/^unknown option/.test(stderr) || /handshake failure/.test(stderr)) {
      // using an incompatible or too old version of openssl
      console.error('Skipping: incompatible or too old version of openssl.');
      console.error(stderr);
      openssl_ok = false;
    }
    response = stdout;
    server.close();
  });
});