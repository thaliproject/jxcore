// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

// Installing a custom uncaughtException handler should override the default
// one that the cluster module installs.
// https://github.com/joyent/node/issues/2556



var common = require('../common');
var assert = require('assert');
var cluster = require('cluster');
var fork = require('child_process').fork;

var MAGIC_EXIT_CODE = 42;

var isTestRunner = process.argv[2] != 'child';

if (isTestRunner) {
  var exitCode = -1;

  process.on('exit', function() {
    assert.equal(exitCode, MAGIC_EXIT_CODE);
  });

  var master = fork(__filename, ['child']);
  master.on('exit', function(code) {
    exitCode = code;
  });
}
else if (cluster.isMaster) {
  process.on('uncaughtException', function() {
    process.nextTick(function() {
      process.exit(MAGIC_EXIT_CODE);
    });
  });

  cluster.fork();
  throw new Error('kill master');
}
else { // worker
  process.exit();
}