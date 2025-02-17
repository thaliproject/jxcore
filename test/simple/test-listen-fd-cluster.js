// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var http = require('http');
var net = require('net');
var PORT = common.PORT;
var spawn = require('child_process').spawn;
var cluster = require('cluster');

console.error('Cluster listen fd test', process.argv.slice(2));

if (process.platform === 'win32') {
  console.error('Skipping: platform is Windows.');
  process.exit(0);
}

switch (process.argv[2]) {
  case 'master': return master();
  case 'worker': return worker();
  case 'parent': return parent();
  default: return test();
}

// spawn the parent, and listen for it to tell us the pid of the cluster.
// WARNING: This is an example of listening on some arbitrary FD number
// that has already been bound elsewhere in advance.  However, binding
// server handles to stdio fd's is NOT a good or reliable way to do
// concurrency in HTTP servers!  Use the cluster module, or if you want
// a more low-level approach, use child process IPC manually.
function test() {
  var parent = spawn(process.execPath, [__filename, 'parent'], {
    stdio: [ 0, 'pipe', 2 ]
  });
  var json = '';
  parent.stdout.on('data', function(c) {
    json += c.toString();
    if (json.indexOf('\n') !== -1) next();
  });
  function next() {
    console.error('output from parent = %s', json);
    var cluster = JSON.parse(json);
    // now make sure that we can request to the worker, then kill it.
    http.get({
      server: 'localhost',
      port: PORT,
      path: '/',
    }).on('response', function (res) {
      var s = '';
      res.on('data', function(c) {
        s += c.toString();
      });
      res.on('end', function() {
        // kill the worker before we start doing asserts.
        // it's really annoying when tests leave orphans!
        parent.kill();
        process.kill(cluster.master, 'SIGKILL');

        assert.equal(s, 'hello from worker\n');
        assert.equal(res.statusCode, 200);
        console.log('ok');
      });
    })
  }
}

function parent() {
  console.error('about to listen in parent');
  var server = net.createServer(function(conn) {
    console.error('connection on parent');
    conn.end('hello from parent\n');
  }).listen(PORT, function() {
    console.error('server listening on %d', PORT);

    var spawn = require('child_process').spawn;
    var master = spawn(process.execPath, [__filename, 'master'], {
      stdio: [ 0, 1, 2, server._handle ],
      detached: true
    });

    // Now close the parent, so that the master is the only thing
    // referencing that handle.  Note that connections will still
    // be accepted, because the master has the fd open.
    server.close();

    master.on('exit', function(code) {
      console.error('master exited', code);
    });

    master.on('close', function() {
      console.error('master closed');
    });
    console.error('master spawned');
  });
}

function master() {
  console.error('in master, spawning worker');
  cluster.setupMaster({
    args: [ 'worker' ]
  });
  var worker = cluster.fork();
  console.log('%j\n', { master: process.pid, worker: worker.pid });
}


function worker() {
  console.error('worker, about to create server and listen on fd=3');
  // start a server on fd=3
  http.createServer(function(req, res) {
    console.error('request on worker');
    console.error('%s %s', req.method, req.url, req.headers);
    res.end('hello from worker\n');
  }).listen({ fd: 3 }, function() {
    console.error('worker listening on fd=3');
  });
}