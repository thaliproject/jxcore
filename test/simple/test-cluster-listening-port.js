// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var assert = require('assert');
var cluster = require('cluster');
var net = require('net');

if (cluster.isMaster) {
  var port = null;
  cluster.fork();
  cluster.on('listening', function(worker, address) {
    port = address.port;
    // ensure that the port is not 0 or null
    assert(port);
    // ensure that the port is numerical
    assert.strictEqual(typeof(port), 'number');
    worker.kill();
  });
  process.on('exit', function() {
    // ensure that the 'listening' handler has been called
    assert(port);
  });
}
else {
  net.createServer(assert.fail).listen(0);
}