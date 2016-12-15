// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var exec = require('child_process').exec;
var assert = require('assert');

var cmd = 'echo "hello world"';

exec(cmd, { maxBuffer: 5 }, function(err, stdout, stderr) {
  assert.ok(err);
  assert.ok(/maxBuffer/.test(err.message));
});