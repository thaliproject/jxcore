// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var cluster = require('cluster');

if (!cluster.isMaster) {
  process.exit(42);
}
else {
  var seenExit = 0;
  var seenDeath = 0;
  var worker = cluster.fork();
  worker.on('exit', function(exitCode, signalCode) {
    assert.equal(exitCode, 42);
    assert.equal(signalCode, null);
    seenExit++;
  });
  cluster.on('exit', function(worker_) {
    assert.equal(worker_, worker);
    seenDeath++;
  });
  process.on('exit', function() {
    assert.equal(seenExit, 1);
    assert.equal(seenDeath, 1);
  });
}