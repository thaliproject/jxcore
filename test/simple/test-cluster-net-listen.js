// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var cluster = require('cluster');
var net = require('net');

if (cluster.isMaster) {
  // ensure that the worker exits peacefully
  var worker = cluster.fork();
  worker.on('exit', function(statusCode) {
    assert.equal(statusCode, 0);
    worker = null;
  });
  process.on('exit', function() {
    assert.equal(worker, null);
  });
}
else {
  // listen() without port should not trigger a libuv assert
  net.createServer(assert.fail).listen(process.exit);
}