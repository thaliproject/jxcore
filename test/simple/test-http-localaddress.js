// Copyright & License details are available under JXCORE_LICENSE file

if (['linux', 'win32'].indexOf(process.platform) == -1) {
  console.error('Skipping: platform-specific test.');
  process.exit(0);
}

var common = require('../common');
var http = require('http'),
    assert = require('assert');

var server = http.createServer(function (req, res) {
  console.log("Connect from: " + req.connection.remoteAddress);
  assert.equal('127.0.0.2', req.connection.remoteAddress);

  req.on('end', function() {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('You are from: ' + req.connection.remoteAddress);
  });
  req.resume();
});

server.listen(common.PORT, "127.0.0.1", function() {
  var options = { host: 'localhost',
    port: common.PORT,
    path: '/',
    method: 'GET',
    localAddress: '127.0.0.2' };

  var req = http.request(options, function(res) {
    res.on('end', function() {
      server.close();
      process.exit();
    });
    res.resume();
  });
  req.end();
});