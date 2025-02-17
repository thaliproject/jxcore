// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var path = require('path');
var assert = require('assert');
var spawn = require('child_process').spawn;
var common = require('../common');

var child = spawn(process.argv[0], [
  path.join(common.fixturesDir, 'GH-1899-output.js')
]);
var output = '';

child.stdout.on('data', function(data) {
  output += data;
});

child.on('exit', function(code, signal) {
  assert.equal(code, 0);
  assert.equal(output, 'hello, world!\n');
});