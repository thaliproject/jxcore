// Copyright & License details are available under JXCORE_LICENSE file

if (process.platform === 'win32') {
  console.error('Skipping: dgram clustering is currently not supported on Windows.');
  process.exit(0);
}
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}
var NUM_WORKERS = 4;
var PACKETS_PER_WORKER = 10;

var assert = require('assert');
var cluster = require('cluster');
var common = require('../common');
var dgram = require('dgram');

if (cluster.isMaster)
  master();
else
  worker();

function master() {
  var i;
  var received = 0;

  // Start listening on a socket.
  var socket = dgram.createSocket('udp4');
  socket.bind(common.PORT);

  // Disconnect workers when the expected number of messages have been
  // received.
  socket.on('message', function(data, info) {
    received++;

    if (received == PACKETS_PER_WORKER * NUM_WORKERS) {
      console.log('master received %d packets', received);

      // Close the socket.
      socket.close();

      // Disconnect all workers.
      cluster.disconnect();
    }
  });

  // Fork workers.
  for (var i = 0; i < NUM_WORKERS; i++)
    cluster.fork();
}

function worker() {
  // Create udp socket and send packets to master.
  var socket = dgram.createSocket('udp4');
  var buf = new Buffer('hello world');

  for (var i = 0; i < PACKETS_PER_WORKER; i++)
    socket.send(buf, 0, buf.length, common.PORT, '127.0.0.1');

  console.log('worker %d sent %d packets', cluster.worker.id, PACKETS_PER_WORKER);
}