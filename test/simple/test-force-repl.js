// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var spawn = require('child_process').spawn;

// spawn a node child process in "interactive" mode (force the repl)
var cp = spawn(process.execPath, ['-i']);
var gotToEnd = false;
var timeoutId = setTimeout(function() {
  throw new Error('timeout!');
}, 1000); // give node + the repl 1 second to boot up

cp.stdout.setEncoding('utf8');

cp.stdout.once('data', function(b) {
  clearTimeout(timeoutId);
  assert.equal(b, '> ');
  gotToEnd = true;
  cp.kill();
});

process.on('exit', function() {
  assert(gotToEnd);
});