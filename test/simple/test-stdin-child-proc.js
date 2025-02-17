// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

// This tests that pausing and resuming stdin does not hang and timeout
// when done in a child process.  See test/simple/test-stdin-pause-resume.js
var common = require('../common');
var child_process = require('child_process');
var path = require('path');
child_process.spawn(process.execPath,
                    [path.resolve(__dirname, 'test-stdin-pause-resume.js')]);