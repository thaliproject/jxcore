// Copyright & License details are available under JXCORE_LICENSE file

// This is actually more a fixture than a test. It is used to make
// sure that require('./path') and require('path') do different things.
// It has to be in the same directory as the test 'test-module-loading.js'
// and it has to have the same name as an internal module.
var common = require('../common');

exports.path_func = function() {
  return 'path_func';
};