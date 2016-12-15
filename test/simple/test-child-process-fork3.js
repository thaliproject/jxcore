// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var child_process = require('child_process');

child_process.fork(common.fixturesDir + '/empty.js'); // should not hang