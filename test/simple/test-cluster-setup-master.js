// Copyright & License details are available under JXCORE_LICENSE file

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var cluster = require('cluster');

if (cluster.isWorker) {

  // Just keep the worker alive
  process.send(process.argv[2]);

} else if (cluster.isMaster) {

  var checks = {
    args: false,
    setupEvent: false,
    settingsObject: false
  };

  var totalWorkers = 2;

  cluster.once('setup', function() {
    checks.setupEvent = true;

    var settings = cluster.settings;
    if (settings &&
        settings.args && settings.args[0] === 'custom argument' &&
        settings.silent === true &&
        settings.exec === process.argv[1]) {
      checks.settingsObject = true;
    }
  });

  // Setup master
  cluster.setupMaster({
    args: ['custom argument'],
    silent: true
  });

  var correctIn = 0;

  cluster.on('online', function lisenter(worker) {

    worker.once('message', function(data) {
      correctIn += (data === 'custom argument' ? 1 : 0);
      if (correctIn === totalWorkers) {
        checks.args = true;
      }
      worker.kill();
    });

    // All workers are online
    if (cluster.onlineWorkers === totalWorkers) {
      checks.workers = true;
    }
  });

  // Start all workers
  cluster.fork();
  cluster.fork();

  // Check all values
  process.once('exit', function() {
    assert.ok(checks.args, 'The arguments was noy send to the worker');
    assert.ok(checks.setupEvent, 'The setup event was never emitted');
    var m = 'The settingsObject do not have correct properties';
    assert.ok(checks.settingsObject, m);
  });

}