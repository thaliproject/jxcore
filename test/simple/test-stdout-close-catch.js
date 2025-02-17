// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var path = require('path');
var child_process = require('child_process');
var fs = require('fs');

var testScript = path.join(common.fixturesDir, 'catch-stdout-error.js');

var cmd = JSON.stringify(process.execPath) + ' ' +
          JSON.stringify(testScript) + ' | ' +
          JSON.stringify(process.execPath) + ' ' +
          '-pe "process.exit(1);"';

var child = child_process.exec(cmd);
var output = '';
var outputExpect = { 'code': 'EPIPE',
                     'errno': 'EPIPE',
                     'syscall': 'write' };

child.stderr.on('data', function(c) {
  output += c;
});

child.on('close', function(code) {
  try {
    output = JSON.parse(output);
  } catch (er) {
    console.error(output);
    process.exit(1);
  }

  assert.deepEqual(output, outputExpect);
  console.log('ok');
});