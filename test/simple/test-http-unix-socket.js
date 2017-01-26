// Copyright & License details are available under JXCORE_LICENSE file

if (process.platform === 'ios') {
  console.error('Skipping: the test does not work on iOS');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var fs = require('fs');
var http = require('http');

var status_ok = false; // status code == 200?
var headers_ok = false;
var body_ok = false;

var server = http.createServer(function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Connection': 'close'
  });
  res.write('hello ');
  res.write('world\n');
  res.end();
});

server.listen(common.PIPE, function() {

  var options = {
    socketPath: common.PIPE,
    path: '/'
  };

  var req = http.get(options, function(res) {
    assert.equal(res.statusCode, 200);
    status_ok = true;

    assert.equal(res.headers['content-type'], 'text/plain');
    headers_ok = true;

    res.body = '';
    res.setEncoding('utf8');

    res.on('data', function(chunk) {
      res.body += chunk;
    });

    res.on('end', function() {
      assert.equal(res.body, 'hello world\n');
      body_ok = true;
      server.close();
    });
  });

  req.on('error', function(e) {
    console.log(e.stack);
    process.exit(1);
  });

  req.end();

});

process.on('exit', function() {
  assert.ok(status_ok);
  assert.ok(headers_ok);
  assert.ok(body_ok);

  // Double close should throw. Follows net_legacy behaviour.
  assert.throws(function() {
    server.close();
  });
});