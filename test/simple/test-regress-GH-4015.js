// Copyright & License details are available under JXCORE_LICENSE file

if (process.env.CITEST) {
  console.error('Skipping test due to CITEST environmental variable.');
  process.exit();
}

var common = require('../common');
var assert = require('assert');
var exec = require('child_process').exec;

var cmd = process.execPath
        + ' '
        + common.fixturesDir
        + '/test-regress-GH-4015.js';

exec(cmd, function(err, stdout, stderr) {
  if(process.versions.v8)
    assert(/RangeError: Maximum call stack size exceeded/.test(stderr));
  else
    // On recent Ubuntu releases the test was failing because the 
    // err.signal value doesn't get set properly.
    // The current fix in JXcore catches the SIGSEGV signal at a place
    // where is too late to get the err object filled properly, therefore
    // in the test we need to use the error code value (128 + 11).
    assert(err.code == 139 || err.signal == "SIGSEGV" );
});
