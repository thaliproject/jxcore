// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}



var common = require('../common');
var assert = require('assert');
var Process = process.binding('process_wrap').Process;
var Pipe = process.binding('pipe_wrap').Pipe;
var pipe = new Pipe();
var p = new Process();

var processExited = false;
var gotPipeEOF = false;
var gotPipeData = false;

p.onexit = function(exitCode, signal) {
  console.log('exit');
  p.close();
  pipe.readStart();

  assert.equal(0, exitCode);
  assert.equal(0, signal);

  processExited = true;
};

pipe.onread = function(b, off, len) {
  assert.ok(processExited);
  if (b) {
    gotPipeData = true;
    console.log('read %d', len);
  } else {
    gotPipeEOF = true;
    pipe.close();
  }
};

p.spawn({
  file: process.execPath,
  args: [process.execPath, '-v'],
  stdio: [
    { type: 'ignore' },
    { type: 'pipe', handle: pipe },
    { type: 'ignore' }
  ]
});


process.on('exit', function() {
  assert.ok(processExited);
  assert.ok(gotPipeEOF);
  assert.ok(gotPipeData);
});