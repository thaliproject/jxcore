// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}
var common = require('../common');
var assert = require('assert');
var join = require('path').join;
var net = require('net');
var fs = require('fs');
var crypto = require('crypto');
var tls = require('tls');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var openssl_ok = true;

exec('openssl version', function(err, stdout, stderr) {
  if (err) {
    openssl_ok = false;
    console.error('Skipping: openssl command is not available.');
    process.exit(0);
  }
});

if (!process.versions.openssl) {
  openssl_ok = false;
  console.error('Skipping: node compiled without OpenSSL.');
  process.exit(0);
}

var connections = 0;
var key = fs.readFileSync(join(common.fixturesDir, 'agent.key')).toString();
var cert = fs.readFileSync(join(common.fixturesDir, 'agent.crt')).toString();

function log(a) {
  console.error('***server*** ' + a);
}

var server = net.createServer(function(socket) {
  connections++;
  log('connection fd=' + socket.fd);
  var sslcontext = crypto.createCredentials({key: key, cert: cert});
  sslcontext.context.setCiphers('RC4-SHA:AES128-SHA:AES256-SHA');

  var pair = tls.createSecurePair(sslcontext, true);

  assert.ok(pair.encrypted.writable);
  assert.ok(pair.cleartext.writable);

  pair.encrypted.pipe(socket);
  socket.pipe(pair.encrypted);

  log('i set it secure');

  pair.on('secure', function() {
    log('connected+secure!');
    pair.cleartext.write('hello\r\n');
    log(pair.cleartext.getPeerCertificate());
    log(pair.cleartext.getCipher());
  });

  pair.cleartext.on('data', function(data) {
    log('read bytes ' + data.length);
    pair.cleartext.write(data);
  });

  socket.on('end', function() {
    log('socket end');
  });

  pair.cleartext.on('error', function(err) {
    log('got error: ');
    log(err);
    log(err.stack);
    socket.destroy();
  });

  pair.encrypted.on('error', function(err) {
    log('encrypted error: ');
    log(err);
    log(err.stack);
    socket.destroy();
  });

  socket.on('error', function(err) {
    log('socket error: ');
    log(err);
    log(err.stack);
    socket.destroy();
  });

  socket.on('close', function(err) {
    log('socket closed');
  });

  pair.on('error', function(err) {
    log('secure error: ');
    log(err);
    log(err.stack);
    socket.destroy();
  });
});

var gotHello = false;
var sentWorld = false;
var gotWorld = false;
var opensslExitCode = -1;

server.listen(common.PORT, function() {
  // To test use: openssl s_client -connect localhost:8000
  var client = spawn('openssl', ['s_client', '-connect', '127.0.0.1:' +
        common.PORT]);

  var out = '';
  client.stdout.setEncoding('utf8');
  client.stdout.on('data', function(d) {
    out += d;

    if (!gotHello && /hello/.test(out)) {
      gotHello = true;
      client.stdin.write('world\r\n');
      sentWorld = true;
    }

    if (!gotWorld && /world/.test(out)) {
      gotWorld = true;
      client.stdin.end();
    }
  });

  client.stdout.pipe(process.stdout, { end: false });

  var err = '';
  client.stderr.setEncoding('utf8');
  client.stderr.on('data', function(chunk) {
    err += chunk;
  });
  client.on('exit', function(code) {
    if (/^unknown option/.test(err) || /handshake failure/.test(err)) {
      // using an incompatible or too old version of openssl
      openssl_ok = false;
      console.error(err);
      console.error('Skipping: incompatible or too old version of OpenSSL');
    } else {
      assert.equal(code, 0);
    }
    opensslExitCode = code;
    server.close();
  });
});

process.on('exit', function() {
  if (openssl_ok) {
    assert.equal(1, connections);
    assert.ok(gotHello);
    assert.ok(sentWorld);
    assert.ok(gotWorld);
    assert.equal(0, opensslExitCode);
  }
});