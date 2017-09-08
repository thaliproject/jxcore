// Copyright & License details are available under JXCORE_LICENSE file
if(process.isEmbedded === true) {
  console.error('Skipping: the test works only in standalone mode');
  process.exit(0);
}


var common = require('../common');

var bigish = Array(200);

for (var i = 0, il = bigish.length; i < il; ++i)
  bigish[i] = -1;

try{
common.spawnPwd({ customFds: bigish });
}catch(e){};
