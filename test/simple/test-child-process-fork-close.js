// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var assert = require('assert'),
    common = require('../common'),
    fork = require('child_process').fork;

var cp = fork(common.fixturesDir + '/child-process-message-and-exit.js');

var gotMessage = false,
    gotExit = false,
    gotClose = false;

cp.on('message', function(message) {
  assert(!gotMessage);
  assert(!gotClose);
  assert.strictEqual(message, 'hello');
  gotMessage = true;
});

cp.on('exit', function() {
  assert(!gotExit);
  assert(!gotClose);
  gotExit = true;
});

cp.on('close', function() {
  assert(gotMessage);
  assert(gotExit);
  assert(!gotClose);
  gotClose = true;
});

process.on('exit', function() {
  assert(gotMessage);
  assert(gotExit);
  assert(gotClose);
});