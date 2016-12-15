// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}
// this test file is not compatible to Windows
if (process.platform === 'win32') return;

var common = require('../common');
var assert = require('assert');
var spawn = require('child_process').spawn;

var cat = spawn('cat');
var called;

assert.ok(process.kill(cat.pid, 0));

cat.on('exit', function() {
  assert.throws(function() {
    process.kill(cat.pid, 0);
  }, Error);
});

cat.stdout.on('data', function() {
  called = true;
  process.kill(cat.pid, 'SIGKILL');
});

// EPIPE when null sig fails
cat.stdin.write('test');

process.on('exit', function() {
  assert.ok(called);
});