// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var spawn = require('child_process').spawn;

var options = {stdio: ['pipe']};
var child = common.spawnPwd(options);

assert.notEqual(child.stdout, null);
assert.notEqual(child.stderr, null);

options = {stdio: 'ignore'};
child = common.spawnPwd(options);

assert.equal(child.stdout, null);
assert.equal(child.stderr, null);