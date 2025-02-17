// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var assert = require('assert');
var child_process = require('child_process');
var spawn = child_process.spawn;
var fork = child_process.fork;

if (process.argv[2] === 'fork') {
  process.stdout.write(JSON.stringify(process.execArgv), function() {
    process.exit();
  });
} else if (process.argv[2] === 'child') {
  fork(__filename, ['fork']);
} else {
  var execArgv = ['--harmony_proxies', '--max-stack-size=0'];
  var args = [__filename, 'child', 'arg0'];

  var child = spawn(process.execPath, execArgv.concat(args));
  var out = '';

  child.stdout.on('data', function (chunk) {
    out += chunk;
  });

  child.on('exit', function () {
  	//console.log("......"+out+"...."+execArgv+".....");
    assert.deepEqual(JSON.parse(out), execArgv);
  });
}