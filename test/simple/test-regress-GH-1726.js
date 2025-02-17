// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}
// Open a chain of five Node processes each a child of the next. The final
// process exits immediately. Each process in the chain is instructed to
// exit when its child exits.
// https://github.com/joyent/node/issues/1726

var common = require('../common');
var assert = require('assert');
var ch = require('child_process');

var gen = +(process.argv[2] || 0);
var maxGen = 5;


if (gen === maxGen) {
  console.error('hit maxGen, exiting', maxGen);
  return;
}

var child = ch.spawn(process.execPath, [__filename, gen + 1], {
  customFds: [0, -1, 2]
});
assert.ok(!child.stdin);
assert.ok(child.stdout);
assert.ok(!child.stderr);

console.error('gen=%d, pid=%d', gen, process.pid);

var timer = setTimeout(function () {
  throw new Error('timeout! gen='+gen);
}, 1000);

child.on('exit', function(code) {
  console.error('exit %d from gen %d', code, gen + 1);
  clearTimeout(timer);
});

child.stdout.pipe(process.stdout);

child.stdout.on('close', function() {
  console.error('child.stdout close  gen=%d', gen);
});