// Copyright & License details are available under JXCORE_LICENSE file


var assert = require('assert');
var common = require('../common.js');
var http = require('http');

var start;
var server = http.createServer(function(req, res) {
  req.resume();
  req.on('end', function() {
    res.end('Success');
  });

  server.close(function() {
    start = process.hrtime();
  });
});

server.listen(common.PORT, 'localhost', function() {
  var interval_id = setInterval(function() {
    if (new Date().getMilliseconds() > 100)
      return;

    var req = http.request({
      'host': 'localhost',
      'port': common.PORT,
      'agent': false,
      'method': 'PUT'
    });

    req.end('Test');
    clearInterval(interval_id);
  }, 10);
});

process.on('exit', function() {
  var d = process.hrtime(start);
  assert.equal(d[0], 0);
  var subSecDelay = (process.platform === 'ios' || 
                     process.platform === 'android') ? 0.10 : 0.03;
  assert(d[1] / 1e9 < subSecDelay);
  console.log('ok');
});