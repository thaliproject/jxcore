'use strict';

var common = require('../common');
var assert = require('assert');

try {
  var crypto = require('crypto');
} catch (e) {
  console.log('Skipping: missing crypto');
  process.exit(0);
}

var methods = ['SSLv3_method', 'SSLv3_client_method', 'SSLv3_server_method'];

methods.forEach(function(method) {
  assert.throws(function() {
    crypto.createCredentials({ secureProtocol: method });
  }, /SSLv3 methods disabled/);
});
