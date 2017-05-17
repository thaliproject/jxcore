// Copyright & License details are available under JXCORE_LICENSE file


if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}


var common = require('../common');
var assert = require('assert');
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');

var options = {
  cwd: common.fixturesDir
};
var child = spawn(process.execPath, ['-e', 'require("foo")'], options);
child.on('exit', function(code) {
  assert.equal(code, 0);
});