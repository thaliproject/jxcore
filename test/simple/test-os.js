// Copyright & License details are available under JXCORE_LICENSE file

var common = require('../common');
var assert = require('assert');
var os = require('os');


process.env.TMPDIR = '/tmpdir';
process.env.TMP = '/tmp';
process.env.TEMP = '/temp';
var t = ( process.platform === 'win32' ? 'c:\\windows\\temp' : '/tmp' );
assert.equal(os.tmpdir(), '/tmpdir');
process.env.TMPDIR = '';
assert.equal(os.tmpdir(), '/tmp');
process.env.TMP = '';
assert.equal(os.tmpdir(), '/temp');
process.env.TEMP = '';

if (process.platform === "android" || process.platform === "ios") {
  // Skip this step on Android/iOS since the expected result is the
  // relative path to the dir where jxcore is executed. 
} else {
  assert.equal(os.tmpdir(), t);
}

var endianness = os.endianness();
console.log('endianness = %s', endianness);
assert.ok(/[BL]E/.test(endianness));

var hostname = os.hostname();
console.log('hostname = %s', hostname);
assert.ok(hostname.length > 0);

var uptime = os.uptime();
console.log('uptime = %d', uptime);
assert.ok(uptime > 0);

var cpus = os.cpus();
console.log('cpus = ', cpus);
assert.ok(cpus.length > 0);

var type = os.type();
console.log('type = ', type);
assert.ok(type.length > 0);

var release = os.release();
console.log('release = ', release);
assert.ok(release.length > 0);

var platform = os.platform();
console.log('platform = ', platform);
assert.ok(platform.length > 0);

var arch = os.arch();
console.log('arch = ', arch);
assert.ok(arch.length > 0);

if (process.platform != 'sunos') {
  // not implemeneted yet
  assert.ok(os.loadavg().length > 0);
  assert.ok(os.freemem() > 0);
  assert.ok(os.totalmem() > 0);
}


var interfaces = os.networkInterfaces();
console.error(interfaces);
switch (platform) {
  case 'linux':
    var filter = function(e) { return e.address == '127.0.0.1'; };
    var actual = interfaces.lo.filter(filter);
    var expected = [{ address: '127.0.0.1', family: 'IPv4', internal: true }];
    assert.deepEqual(actual, expected);
    break;
  case 'win32':
    var filter = function(e) { return e.address == '127.0.0.1'; };
    var actual = interfaces['Loopback Pseudo-Interface 1'].filter(filter);
    var expected = [{ address: '127.0.0.1', family: 'IPv4', internal: true }];
    assert.deepEqual(actual, expected);
    break;
}

var EOL = os.EOL;
assert.ok(EOL.length > 0);