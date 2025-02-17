// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

if (!process.versions.openssl) {
  console.error('Skipping: node compiled without OpenSSL.');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');

var fs = require('fs');
var exec = require('child_process').exec;

var http = require('http');
var https = require('https');

var options = {
  key: fs.readFileSync(common.fixturesDir + '/keys/agent1-key.pem'),
  cert: fs.readFileSync(common.fixturesDir + '/keys/agent1-cert.pem')
};

var body = 'hello world\n';

// Try first with http server

var server_http = http.createServer(function(req, res) {
  console.log('got HTTP request');
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end(body);
});


server_http.listen(common.PORT, function() {
  var req = http.request({
    port: common.PORT,
    rejectUnauthorized: false
  }, function(res) {
    server_http.close();
    res.resume();
  });
  // These methods should exist on the request and get passed down to the socket
  req.setNoDelay(true);
  req.setTimeout(1000, function() { });
  req.setSocketKeepAlive(true, 1000);
  req.end();
});

// Then try https server (requires functions to be mirroed in tls.js's CryptoStream)

var server_https = https.createServer(options, function(req, res) {
  console.log('got HTTPS request');
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end(body);
});

server_https.listen(common.PORT+1, function() {
  var req = https.request({
    port: common.PORT + 1,
    rejectUnauthorized: false
  }, function(res) {
    server_https.close();
    res.resume();
  });
  // These methods should exist on the request and get passed down to the socket
  req.setNoDelay(true);
  req.setTimeout(1000, function() { });
  req.setSocketKeepAlive(true, 1000);
  req.end();
});