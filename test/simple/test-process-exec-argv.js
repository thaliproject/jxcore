// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var assert = require('assert');
var spawn = require('child_process').spawn;

if (process.argv[2] === 'child') {
  process.stdout.write(JSON.stringify(process.execArgv));
} else {
  var execArgv = ['--harmony_proxies', '--max-stack-size=0'];
  var args = [__filename, 'child', 'arg0'];
  var child = spawn(process.execPath, execArgv.concat(args));
  var out = '';

  child.stdout.on('data', function (chunk) {
    out += chunk;
  });

  child.on('exit', function () {
    assert.deepEqual(JSON.parse(out), execArgv);
  });
}