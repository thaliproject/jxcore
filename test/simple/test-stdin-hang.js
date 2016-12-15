// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');

// This test *only* verifies that invoking the stdin getter does not
// cause node to hang indefinitely.
// If it does, then the test-runner will nuke it.

// invoke the getter.
process.stdin;

console.error('Should exit normally now.');