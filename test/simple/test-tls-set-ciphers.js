// Copyright & License details are available under JXCORE_LICENSE file


var common = require('../common');
var assert = require('assert');
var exec = require('child_process').exec;
var tls = require('tls');
var fs = require('fs');

exec('openssl version', callback());
function callback(err, data) {
  if (err !== null) {
    console.error('Skipping: openssl command is not available.');
    process.exit(0);
  }
}

var options = {
  key: fs.readFileSync(common.fixturesDir + '/keys/agent2-key.pem'),
  cert: fs.readFileSync(common.fixturesDir + '/keys/agent2-cert.pem'),
  ciphers: 'RC4-MD5'
};

var reply = 'I AM THE WALRUS'; // something recognizable
var nconns = 0;
var response = '';

process.on('exit', function() {
  assert.equal(nconns, 1);
  assert.notEqual(response.indexOf(reply), -1);
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
    response = stdout;
    server.close();
  });
});