// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}

var common = require('../common');
var assert = require('assert');
var http = require('http');
var childProcess = require('child_process');
var exec = require('child_process').exec;

exec('curl --version', function(err, stdout, stderr) {
  if (err) {
    console.error("Skipping: 'curl' command is not available.");
    process.exit(0);
  }
});

var s = http.createServer(function(request, response) {
  response.writeHead(304);
  response.end();
});

s.listen(common.PORT, function() {
  childProcess.exec('curl -i http://127.0.0.1:' + common.PORT + '/',
                    function(err, stdout, stderr) {
                      if (err) throw err;
                      s.close();
                      common.error('curled response correctly');
                      common.error(common.inspect(stdout));
                    });
});

console.log('Server running at http://127.0.0.1:' + common.PORT + '/');
