// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var fork = require('child_process').fork;

var expected = Array(1e5).join('ßßßß');
if (process.argv[2] === 'child') {
  process.send(expected);
} else {
  var child = fork(process.argv[1], ['child']);
  child.on('message', common.mustCall(function(actual) {
    assert.equal(actual, expected);
  }));
}