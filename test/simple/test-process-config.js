// Copyright & License details are available under JXCORE_LICENSE file

if (process.platform === "android" || process.platform === "ios") {
    console.error('Skipping: mobile platform.');
    process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var fs = require('fs');
var path = require('path');

// check for existence
assert(process.hasOwnProperty('config'));

// ensure that `process.config` is an Object
assert(Object(process.config) === process.config);

var configPath = path.resolve(__dirname, '..', '..', 'config.gypi');
var config = fs.readFileSync(configPath, 'utf8');

// clean up comment at the first line
config = config.split('\n').slice(1).join('\n').replace(/'/g, '"');
config = JSON.parse(config, function(key, value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
});

assert.deepEqual(config, process.config);
