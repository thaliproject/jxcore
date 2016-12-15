// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var fork = require('child_process').fork;

if (process.argv[2] === 'child') {
  console.log('child -> call disconnect');
  process.disconnect();

  setTimeout(function() {
    console.log('child -> will this keep it alive?');
    process.on('message', function () { });
  }, 400);

} else {
  var child = fork(__filename, ['child']);

  child.on('disconnect', function () {
    console.log('parent -> disconnect');
  });

  child.once('exit', function () {
    console.log('parent -> exit');
  });
}