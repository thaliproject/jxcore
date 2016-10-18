'use strict';

var common = require('../common');
var assert = require('assert');

try {
  var crypto = require('crypto');
} catch (e) {
  console.log('Skipping: missing crypto');
  process.exit(0);
}

var methods = ['TLSv1_method', 'TLSv1_client_method', 'TLSv1_server_method'];

methods.forEach(function(method) {
  assert.throws(function() {
    crypto.createCredentials({ secureProtocol: method });
  }, /TLSv1 methods disabled/);
});
