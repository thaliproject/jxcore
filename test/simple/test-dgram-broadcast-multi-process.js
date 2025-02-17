// Copyright & License details are available under JXCORE_LICENSE file

if (process.env.CITEST) {
  console.error('Skipping: due to CITEST environmental variable.');
  process.exit(0);
}

if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common'),
    assert = require('assert'),
    dgram = require('dgram'),
    util = require('util'),
    networkInterfaces = require('os').networkInterfaces(),
    Buffer = require('buffer').Buffer,
    fork = require('child_process').fork,
    LOCAL_BROADCAST_HOST = '255.255.255.255',
    TIMEOUT = 5000,
    messages = [
      new Buffer('First message to send'),
      new Buffer('Second message to send'),
      new Buffer('Third message to send'),
      new Buffer('Fourth message to send')
    ];

// take the first non-internal interface as the address for binding
get_bindAddress: for (var name in networkInterfaces) {
  var interfaces = networkInterfaces[name];
  for(var i = 0; i < interfaces.length; i++) {
    var localInterface = interfaces[i];
    if (!localInterface.internal && localInterface.family === 'IPv4') {
      var bindAddress = localInterface.address;
      break get_bindAddress;
    }
  }
}
assert.ok(bindAddress);

if (process.argv[2] !== 'child') {
  var workers = {},
      listeners = 3,
      listening = 0,
      dead = 0,
      i = 0,
      done = 0,
      timer = null;

  //exit the test if it doesn't succeed within TIMEOUT
  timer = setTimeout(function() {
    console.error('[PARENT] Responses were not received within %d ms.',
                  TIMEOUT);
    console.error('[PARENT] Fail');

    killChildren(workers);

    process.exit(1);
  }, TIMEOUT);

  //launch child processes
  for (var x = 0; x < listeners; x++) {
    (function() {
      var worker = fork(process.argv[1], ['child']);
      workers[worker.pid] = worker;

      worker.messagesReceived = [];

      //handle the death of workers
      worker.on('exit', function(code, signal) {
        // don't consider this the true death if the worker
        // has finished successfully
        // or if the exit code is 0
        if (worker.isDone || code == 0) {
          return;
        }

        dead += 1;
        console.error('[PARENT] Worker %d died. %d dead of %d',
                      worker.pid,
                      dead,
                      listeners);

        if (dead === listeners) {
          console.error('[PARENT] All workers have died.');
          console.error('[PARENT] Fail');

          killChildren(workers);

          process.exit(1);
        }
      });

      worker.on('message', function(msg) {
        if (msg.listening) {
          listening += 1;

          if (listening === listeners) {
            //all child process are listening, so start sending
            sendSocket.sendNext();
          }
        }
        else if (msg.message) {
          worker.messagesReceived.push(msg.message);

          if (worker.messagesReceived.length === messages.length) {
            done += 1;
            worker.isDone = true;
            console.error('[PARENT] %d received %d messages total.',
                          worker.pid,
                          worker.messagesReceived.length);
          }

          if (done === listeners) {
            console.error('[PARENT] All workers have received the ' +
                          'required number of ' +
                          'messages. Will now compare.');

            Object.keys(workers).forEach(function(pid) {
              var worker = workers[pid];

              var count = 0;

              worker.messagesReceived.forEach(function(buf) {
                for (var i = 0; i < messages.length; ++i) {
                  if (buf.toString() === messages[i].toString()) {
                    count++;
                    break;
                  }
                }
              });

              console.error('[PARENT] %d received %d matching messges.',
                            worker.pid,
                            count);

              assert.equal(count, messages.length,
                           'A worker received an invalid multicast message');
            });

            clearTimeout(timer);
            console.error('[PARENT] Success');
            killChildren(workers);
          }
        }
      });
    })(x);
  }

  var sendSocket = dgram.createSocket('udp4');

  // bind the address explicitly for sending
  // INADDR_BROADCAST to only one interface
  sendSocket.bind(common.PORT, bindAddress);
  sendSocket.on('listening', function () {
    sendSocket.setBroadcast(true);
  });

  sendSocket.on('close', function() {
    console.error('[PARENT] sendSocket closed');
  });

  sendSocket.sendNext = function() {
    var buf = messages[i++];

    if (!buf) {
      try { sendSocket.close(); } catch (e) {}
      return;
    }

    sendSocket.send(buf, 0, buf.length,
                    common.PORT, LOCAL_BROADCAST_HOST, function(err) {

          if (err) throw err;

          console.error('[PARENT] sent %s to %s:%s',
                        util.inspect(buf.toString()),
                        LOCAL_BROADCAST_HOST, common.PORT);

          process.nextTick(sendSocket.sendNext);
        });
  };

  function killChildren(children) {
    Object.keys(children).forEach(function(key) {
      var child = children[key];
      child.kill();
    });
  }
}

if (process.argv[2] === 'child') {
  var receivedMessages = [];
  var listenSocket = dgram.createSocket('udp4');

  listenSocket.on('message', function(buf, rinfo) {
    // receive udp messages only sent from parent
    if (rinfo.address !== bindAddress) return;

    console.error('[CHILD] %s received %s from %j',
                  process.pid,
                  util.inspect(buf.toString()),
                  rinfo);

    receivedMessages.push(buf);

    process.send({ message: buf.toString() });

    if (receivedMessages.length == messages.length) {
      process.nextTick(function() {
        listenSocket.close();
      });
    }
  });

  listenSocket.on('close', function() {
    //HACK: Wait to exit the process to ensure that the parent
    //process has had time to receive all messages via process.send()
    //This may be indicitave of some other issue.
    setTimeout(function() {
      process.exit();
    }, 1000);
  });

  listenSocket.on('listening', function() {
    process.send({ listening: true });
  });

  listenSocket.bind(common.PORT);
}
