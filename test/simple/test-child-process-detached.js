// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var path = require('path');

var spawn = require('child_process').spawn;
var childPath = path.join(__dirname, '..', 'fixtures', 'parent-process-nonpersistent.js');
var persistentPid = -1;

var child = spawn(process.execPath, [ childPath ]);

child.stdout.on('data', function (data) {
  persistentPid = parseInt(data, 10);
});

process.on('exit', function () {
  assert(persistentPid !== -1);
  assert.throws(function () {
    process.kill(child.pid);
  });
  assert.doesNotThrow(function () {
    process.kill(persistentPid);
  });
});