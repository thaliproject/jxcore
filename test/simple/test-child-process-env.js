// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');

var spawn = require('child_process').spawn;

var isWindows = process.platform === 'win32';
var isAndroid = process.platform === 'android';

var env = {
  'HELLO': 'WORLD'
};
env.__proto__ = {
  'FOO': 'BAR'
};

if (isWindows) {
  var child = spawn('cmd.exe', ['/c', 'set'], {env: env});
} else {
  var child = spawn(isAndroid ? '/system/bin/env' : '/usr/bin/env', [], {env: env});
}


var response = '';

child.stdout.setEncoding('utf8');

child.stdout.on('data', function(chunk) {
  response += chunk;
});

process.on('exit', function() {
  assert.ok(response.indexOf('HELLO=WORLD') >= 0);
  assert.ok(response.indexOf('FOO=BAR') >= 0);
});