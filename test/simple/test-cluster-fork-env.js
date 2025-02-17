// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var cluster = require('cluster');

if (cluster.isWorker) {
  cluster.worker.send({
    prop: process.env['cluster_test_prop'],
    overwrite: process.env['cluster_test_overwrite']
  });

} else if (cluster.isMaster) {

  var checks = {
    using: false,
    overwrite: false
  };

  // To check that the cluster extend on the process.env we will overwrite a
  // property
  process.env['cluster_test_overwrite'] = 'old';

  // Fork worker
  var worker = cluster.fork({
    'cluster_test_prop': 'custom',
    'cluster_test_overwrite': 'new'
  });

  // Checks worker env
  worker.on('message', function(data) {
    checks.using = (data.prop === 'custom');
    checks.overwrite = (data.overwrite === 'new');
    process.exit(0);
  });

  process.once('exit', function() {
    assert.ok(checks.using, 'The worker did not receive the correct env.');
    assert.ok(checks.overwrite, 'The custom environment did not overwrite ' +
              'the existing environment.');
  });

}