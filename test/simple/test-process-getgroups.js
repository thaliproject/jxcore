// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var exec = require('child_process').exec;

if (process.platform === 'darwin') {
  console.log('Skipping: Output of `id -G` is unreliable on Darwin.');
  process.exit(0);
}

// On Android 'id -G'  returns '1004 1007 1011 1015 1028 3001 3002 3003 3006'
// process.getgroups() returns '1004 1007 1011 1015 1028 3001 3002 3003 3006 0'
if (process.platform === 'android') {
  console.log('Skipping: platform is Android.');
  process.exit(0);
}

if (typeof process.getgroups === 'function') {
  var groups = process.getgroups();
  assert(Array.isArray(groups));
  assert(groups.length > 0);
  exec('id -G', function(err, stdout) {
    if (err) throw err;
    var real_groups = stdout.match(/\d+/g).map(Number);
    assert.equal(groups.length, real_groups.length);
    check(groups, real_groups);
    check(real_groups, groups);
  });
}

function check(a, b) {
  for (var i = 0; i < a.length; ++i) assert(b.indexOf(a[i]) !== -1);
}