// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var ch = require('child_process');

var SIZE = 100000;
var childGone = false;

if (process.platform === "android") {
  var _eval = 'var size = ' + SIZE + '; while(size--) { process.stdout.write("C"); }';
  var cp = ch.spawn(process.execPath, ['-e', _eval], { customFds: [0, 1, 2] });
} else {
  var cp = ch.spawn('python', ['-c', 'print ' + SIZE + ' * "C"'], { customFds: [0, 1, 2] });
}

cp.on('exit', function(code) {
  childGone = true;
  assert.equal(0, code);
});

process.on('exit', function() {
  assert.ok(childGone);
});