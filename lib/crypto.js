// Copyright & License details are available under JXCORE_LICENSE file

exports.DEFAULT_ENCODING = 'buffer';

try {
  var binding = process.binding('crypto');
  var SecureContext = binding.SecureContext;
  var randomBytes = binding.randomBytes;
  var pseudoRandomBytes = binding.pseudoRandomBytes;
  var getCiphers = binding.getCiphers;
  var getHashes = binding.getHashes;
  var crypto = true;
} catch (e) {

  var crypto = false;
}

var constants = process.binding('constants');

var stream = require('stream');
var util = require('util');

// This is here because many functions accepted binary strings without
// any explicit encoding in older versions of node, and we don't want
// to break them unnecessarily.
function toBuf(str, encoding) {
  encoding = encoding || 'binary';
  if (typeof str === 'string') {
    if (encoding === 'buffer')
      encoding = 'binary';
    str = new Buffer(str, encoding);
  }
  return str;
}

var debug;
if (process.env.NODE_DEBUG && /crypto/.test(process.env.NODE_DEBUG)) {
  debug = function (a) {
    console.error('CRYPTO:', a);
  };
} else {
  debug = function () {
  };
}

var assert = require('assert');
var StringDecoder = require('string_decoder').StringDecoder;

var CONTEXT_DEFAULT_OPTIONS = constants.SSL_OP_NO_SSLv2|constants.SSL_OP_NO_SSLv3|constants.SSL_OP_NO_TLSv1;

function getSecureOptions(secureProtocol, secureOptions) {

  switch(secureProtocol)
  {
    case undefined:
    case 'SSLv2_method':
    case 'SSLv3_method':
    case 'TLSv1_method':
    case 'SSLv23_method':

    secureProtocol='SSLv23_method';
    break;

    case 'SSLv2_server_method':
    case 'SSLv3_server_method':
    case 'TLSv1_server_method':
    case 'SSLv23_server_method':

    secureProtocol='SSLv23_server_method';
    break;


    case 'SSLv2_client_method':
    case 'SSLv3_client_method':
    case 'TLSv1_client_method':
    case 'SSLv23_client_method':

    secureProtocol='SSLv23_client_method';
    
    break;

    case 'TLSv1_1_method':
    case 'TLSv1_1_method':
    case 'TLSv1_1_server_method':
    case 'TLSv1_2_server_method':
    case 'TLSv1_2_client_method':
    case 'TLSv1_2_client_method':
    break;

    default:
    
    secureProtcol='SSLv23_method';
    break;

  }
  if (secureOptions === undefined ||
    isNaN(Number(secureOptions))) {
    secureOptions=CONTEXT_DEFAULT_OPTIONS;
  } else {
    secureOptions|=CONTEXT_DEFAULT_OPTIONS;
  }
  
  return secureOptions;
}
exports._getSecureOptions = getSecureOptions;


function Credentials(secureProtocol, flags, context) {
  if (!(this instanceof Credentials)) {
    return new Credentials(secureProtocol, flags, context);
  }

  if (!crypto) {
    throw new Error('node.js not compiled with openssl crypto support.');
  }

  if (context) {
    this.context = context;
  } else {
    this.context = new SecureContext();

    if (secureProtocol) {
      this.context.init(secureProtocol);
    } else {
      this.context.init();
    }
  }

  flags = getSecureOptions(secureProtocol, flags);

  this.context.setOptions(flags);
}

exports.Credentials = Credentials;


exports.createCredentials = function(options, context) {
  if (!options) options = {};

  var c = new Credentials(options.secureProtocol,
                          options.secureOptions,
                          context);

  if (context) return c;

  if (options.key) {
    if (options.passphrase) {
      c.context.setKey(options.key, options.passphrase);
    } else {
      c.context.setKey(options.key);
    }
  }

  if (options.cert) c.context.setCert(options.cert);

  if (options.ciphers) c.context.setCiphers(options.ciphers);

  if (options.ca) {
    if (Array.isArray(options.ca)) {
      for (var i = 0, len = options.ca.length; i < len; i++) {
        c.context.addCACert(options.ca[i]);
      }
    } else {
      c.context.addCACert(options.ca);
    }
  } else {
    c.context.addRootCerts();
  }

  if (options.crl) {
    if (Array.isArray(options.crl)) {
      for (var i = 0, len = options.crl.length; i < len; i++) {
        c.context.addCRL(options.crl[i]);
      }
    } else {
      c.context.addCRL(options.crl);
    }
  }

  if (options.sessionIdContext) {
    c.context.setSessionIdContext(options.sessionIdContext);
  }

  if (options.pfx) {
    var pfx = options.pfx;
    var passphrase = options.passphrase;

    pfx = toBuf(pfx);
    if (passphrase) passphrase = toBuf(passphrase);

    if (passphrase) {
      c.context.loadPKCS12(pfx, passphrase);
    } else {
      c.context.loadPKCS12(pfx);
    }
  }

  if (options.pskServerCallback) {
    debug('a psk call back provider');
    c.context.setPskServerCallback(options.pskServerCallback);
  }

  if (options.pskServerHint) {
    c.context.setPskHint(options.pskServerHint);
  }

  return c;
};


function LazyTransform(options) {
  this._options = options;
}
util.inherits(LazyTransform, stream.Transform);

[
  '_readableState',
  '_writableState',
  '_transformState'
].forEach(function(prop, i, props) {
  Object.defineProperty(LazyTransform.prototype, prop, {
    get: function() {
      stream.Transform.call(this, this._options);
      this._writableState.decodeStrings = false;
      this._writableState.defaultEncoding = 'binary';
      return this[prop];
    },
    set: function(val) {
      Object.defineProperty(this, prop, {
        value: val,
        enumerable: true,
        configurable: true,
        writable: true
      });
    },
    configurable: true,
    enumerable: true
  });
});


exports.createHash = exports.Hash = Hash;
function Hash(algorithm, options) {
  if (!(this instanceof Hash)) return new Hash(algorithm, options);
  this._binding = new binding.Hash(algorithm);
  LazyTransform.call(this, options);
}

util.inherits(Hash, LazyTransform);

Hash.prototype._transform = function(chunk, encoding, callback) {
  this._binding.update(chunk, encoding);
  callback();
};

Hash.prototype._flush = function(callback) {
  var encoding = this._readableState.encoding || 'buffer';
  this.push(this._binding.digest(encoding), encoding);
  callback();
};

Hash.prototype.update = function(data, encoding) {
  encoding = encoding || exports.DEFAULT_ENCODING;
  if (encoding === 'buffer' && typeof data === 'string') encoding = 'binary';
  this._binding.update(data, encoding);
  return this;
};

Hash.prototype.digest = function(outputEncoding) {
  outputEncoding = outputEncoding || exports.DEFAULT_ENCODING;
  return this._binding.digest(outputEncoding);
};


exports.createHmac = exports.Hmac = Hmac;

function Hmac(hmac, key, options) {
  if (!(this instanceof Hmac)) return new Hmac(hmac, key, options);
  this._binding = new binding.Hmac();
  this._binding.init(hmac, toBuf(key));
  LazyTransform.call(this, options);
}

util.inherits(Hmac, LazyTransform);

Hmac.prototype.update = Hash.prototype.update;
Hmac.prototype.digest = Hash.prototype.digest;
Hmac.prototype._flush = Hash.prototype._flush;
Hmac.prototype._transform = Hash.prototype._transform;


function getDecoder(decoder, encoding) {
  if (encoding === 'utf-8') encoding = 'utf8'; // Normalize encoding.
  decoder = decoder || new StringDecoder(encoding);
  assert(decoder.encoding === encoding, 'Cannot change encoding');
  return decoder;
}


exports.createCipher = exports.Cipher = Cipher;
function Cipher(cipher, password, options) {
  if (!(this instanceof Cipher)) return new Cipher(cipher, password, options);
  this._binding = new binding.Cipher;

  this._binding.init(cipher, toBuf(password));
  this._decoder = null;

  LazyTransform.call(this, options);
}

util.inherits(Cipher, LazyTransform);

Cipher.prototype._transform = function(chunk, encoding, callback) {
  this.push(this._binding.update(chunk, encoding));
  callback();
};

Cipher.prototype._flush = function(callback) {
  try {
    this.push(this._binding.final());
  } catch (e) {
    callback(e);
    return;
  }
  callback();
};

Cipher.prototype.update = function(data, inputEncoding, outputEncoding) {
  inputEncoding = inputEncoding || exports.DEFAULT_ENCODING;
  outputEncoding = outputEncoding || exports.DEFAULT_ENCODING;

  var ret = this._binding.update(data, inputEncoding);

  if (outputEncoding && outputEncoding !== 'buffer') {
    this._decoder = getDecoder(this._decoder, outputEncoding);
    ret = this._decoder.write(ret);
  }

  return ret;
};

Cipher.prototype.final = function(outputEncoding) {
  outputEncoding = outputEncoding || exports.DEFAULT_ENCODING;
  var ret = this._binding.final();

  if (outputEncoding && outputEncoding !== 'buffer') {
    this._decoder = getDecoder(this._decoder, outputEncoding);
    ret = this._decoder.end(ret);
  }

  return ret;
};

Cipher.prototype.setAutoPadding = function(ap) {
  this._binding.setAutoPadding(ap);
  return this;
};


exports.createCipheriv = exports.Cipheriv = Cipheriv;
function Cipheriv(cipher, key, iv, options) {
  if (!(this instanceof Cipheriv))
    return new Cipheriv(cipher, key, iv, options);
  this._binding = new binding.Cipher();
  this._binding.initiv(cipher, toBuf(key), toBuf(iv));
  this._decoder = null;

  LazyTransform.call(this, options);
}

util.inherits(Cipheriv, LazyTransform);

Cipheriv.prototype._transform = Cipher.prototype._transform;
Cipheriv.prototype._flush = Cipher.prototype._flush;
Cipheriv.prototype.update = Cipher.prototype.update;
Cipheriv.prototype.final = Cipher.prototype.final;
Cipheriv.prototype.setAutoPadding = Cipher.prototype.setAutoPadding;


exports.createDecipher = exports.Decipher = Decipher;
function Decipher(cipher, password, options) {
  if (!(this instanceof Decipher))
    return new Decipher(cipher, password, options);

  this._binding = new binding.Decipher;
  this._binding.init(cipher, toBuf(password));
  this._decoder = null;

  LazyTransform.call(this, options);
}

util.inherits(Decipher, LazyTransform);

Decipher.prototype._transform = Cipher.prototype._transform;
Decipher.prototype._flush = Cipher.prototype._flush;
Decipher.prototype.update = Cipher.prototype.update;
Decipher.prototype.final = Cipher.prototype.final;
Decipher.prototype.finaltol = Cipher.prototype.final;
Decipher.prototype.setAutoPadding = Cipher.prototype.setAutoPadding;


exports.createDecipheriv = exports.Decipheriv = Decipheriv;
function Decipheriv(cipher, key, iv, options) {
  if (!(this instanceof Decipheriv))
    return new Decipheriv(cipher, key, iv, options);

  this._binding = new binding.Decipher;
  this._binding.initiv(cipher, toBuf(key), toBuf(iv));
  this._decoder = null;

  LazyTransform.call(this, options);
}

util.inherits(Decipheriv, LazyTransform);

Decipheriv.prototype._transform = Cipher.prototype._transform;
Decipheriv.prototype._flush = Cipher.prototype._flush;
Decipheriv.prototype.update = Cipher.prototype.update;
Decipheriv.prototype.final = Cipher.prototype.final;
Decipheriv.prototype.finaltol = Cipher.prototype.final;
Decipheriv.prototype.setAutoPadding = Cipher.prototype.setAutoPadding;


exports.createSign = exports.Sign = Sign;
function Sign(algorithm, options) {
  if (!(this instanceof Sign)) return new Sign(algorithm, options);
  this._binding = new binding.Sign();
  this._binding.init(algorithm);

  stream.Writable.call(this, options);
}

util.inherits(Sign, stream.Writable);

Sign.prototype._write = function(chunk, encoding, callback) {
  this._binding.update(chunk, encoding);
  callback();
};

Sign.prototype.update = Hash.prototype.update;

Sign.prototype.sign = function(key, encoding) {
  encoding = encoding || exports.DEFAULT_ENCODING;
  var ret = this._binding.sign(toBuf(key));

  if (encoding && encoding !== 'buffer') ret = ret.toString(encoding);

  return ret;
};


exports.createVerify = exports.Verify = Verify;
function Verify(algorithm, options) {
  if (!(this instanceof Verify)) return new Verify(algorithm, options);

  this._binding = new binding.Verify;
  this._binding.init(algorithm);

  stream.Writable.call(this, options);
}

util.inherits(Verify, stream.Writable);

Verify.prototype._write = Sign.prototype._write;
Verify.prototype.update = Sign.prototype.update;

Verify.prototype.verify = function(object, signature, sigEncoding) {
  sigEncoding = sigEncoding || exports.DEFAULT_ENCODING;
  return this._binding.verify(toBuf(object), toBuf(signature, sigEncoding));
};

exports.publicEncrypt = function(options, buffer) {
  var key = options.key || options;
  var padding = options.padding || constants.RSA_PKCS1_OAEP_PADDING;
  return binding.publicEncrypt(toBuf(key), buffer, padding);
};

exports.privateDecrypt = function(options, buffer) {
  var key = options.key || options;
  var passphrase = options.passphrase || null;
  var padding = options.padding || constants.RSA_PKCS1_OAEP_PADDING;
  return binding.privateDecrypt(toBuf(key), buffer, padding, passphrase);
};


exports.createDiffieHellman = exports.DiffieHellman = DiffieHellman;

function DiffieHellman(sizeOrKey, encoding) {
  if (!(this instanceof DiffieHellman))
    return new DiffieHellman(sizeOrKey, encoding);

  if (!sizeOrKey)
    this._binding = new binding.DiffieHellman();
  else {
    encoding = encoding || exports.DEFAULT_ENCODING;
    sizeOrKey = toBuf(sizeOrKey, encoding);
    this._binding = new binding.DiffieHellman(sizeOrKey);
  }
}


exports.DiffieHellmanGroup =
    exports.createDiffieHellmanGroup =
    exports.getDiffieHellman = DiffieHellmanGroup;

function DiffieHellmanGroup(name) {
  if (!(this instanceof DiffieHellmanGroup))
    return new DiffieHellmanGroup(name);
  this._binding = new binding.DiffieHellmanGroup(name);
}


DiffieHellmanGroup.prototype.generateKeys =
    DiffieHellman.prototype.generateKeys =
    dhGenerateKeys;

function dhGenerateKeys(encoding) {
  var keys = this._binding.generateKeys();
  encoding = encoding || exports.DEFAULT_ENCODING;
  if (encoding && encoding !== 'buffer') keys = keys.toString(encoding);
  return keys;
}


DiffieHellmanGroup.prototype.computeSecret =
    DiffieHellman.prototype.computeSecret =
    dhComputeSecret;

function dhComputeSecret(key, inEnc, outEnc) {
  inEnc = inEnc || exports.DEFAULT_ENCODING;
  outEnc = outEnc || exports.DEFAULT_ENCODING;
  var ret = this._binding.computeSecret(toBuf(key, inEnc));
  if (outEnc && outEnc !== 'buffer') ret = ret.toString(outEnc);
  return ret;
}


DiffieHellmanGroup.prototype.getPrime =
    DiffieHellman.prototype.getPrime =
    dhGetPrime;

function dhGetPrime(encoding) {
  var prime = this._binding.getPrime();
  encoding = encoding || exports.DEFAULT_ENCODING;
  if (encoding && encoding !== 'buffer') prime = prime.toString(encoding);
  return prime;
}


DiffieHellmanGroup.prototype.getGenerator =
    DiffieHellman.prototype.getGenerator =
    dhGetGenerator;

function dhGetGenerator(encoding) {
  var generator = this._binding.getGenerator();
  encoding = encoding || exports.DEFAULT_ENCODING;
  if (encoding && encoding !== 'buffer')
    generator = generator.toString(encoding);
  return generator;
}


DiffieHellmanGroup.prototype.getPublicKey =
    DiffieHellman.prototype.getPublicKey =
    dhGetPublicKey;

function dhGetPublicKey(encoding) {
  var key = this._binding.getPublicKey();
  encoding = encoding || exports.DEFAULT_ENCODING;
  if (encoding && encoding !== 'buffer') key = key.toString(encoding);
  return key;
}


DiffieHellmanGroup.prototype.getPrivateKey =
    DiffieHellman.prototype.getPrivateKey =
    dhGetPrivateKey;

function dhGetPrivateKey(encoding) {
  var key = this._binding.getPrivateKey();
  encoding = encoding || exports.DEFAULT_ENCODING;
  if (encoding && encoding !== 'buffer') key = key.toString(encoding);
  return key;
}


DiffieHellman.prototype.setPublicKey = function(key, encoding) {
  encoding = encoding || exports.DEFAULT_ENCODING;
  this._binding.setPublicKey(toBuf(key, encoding));
  return this;
};

DiffieHellman.prototype.setPrivateKey = function(key, encoding) {
  encoding = encoding || exports.DEFAULT_ENCODING;
  this._binding.setPrivateKey(toBuf(key, encoding));
  return this;
};


exports.pbkdf2 = function(password, salt, iterations, keylen, callback) {
  if (typeof callback !== 'function')
    throw new Error('No callback provided to pbkdf2');

  return pbkdf2(password, salt, iterations, keylen, callback);
};

exports.pbkdf2Sync = function(password, salt, iterations, keylen) {
  return pbkdf2(password, salt, iterations, keylen);
};

function pbkdf2(password, salt, iterations, keylen, callback) {
  password = toBuf(password);
  salt = toBuf(salt);

  if (exports.DEFAULT_ENCODING === 'buffer')
    return binding.PBKDF2(password, salt, iterations, keylen, callback);

  // at this point, we need to handle encodings.
  var encoding = exports.DEFAULT_ENCODING;
  if (callback) {
    binding.PBKDF2(password, salt, iterations, keylen, function(er, ret) {
      if (ret) ret = ret.toString(encoding);
      callback(er, ret);
    });
  } else {
    var ret = binding.PBKDF2(password, salt, iterations, keylen);
    return ret.toString(encoding);
  }
}

exports.randomBytes = randomBytes;
exports.pseudoRandomBytes = pseudoRandomBytes;

exports.rng = randomBytes;
exports.prng = pseudoRandomBytes;

exports.getCiphers = function() {
  return filterDuplicates(getCiphers.call(null, arguments));
};

exports.getHashes = function() {
  return filterDuplicates(getHashes.call(null, arguments));

};

function filterDuplicates(names) {
  // Drop all-caps names in favor of their lowercase aliases,
  // for example, 'sha1' instead of 'SHA1'.
  var ctx = {};
  names.forEach(function(name) {
    var key = name;
    if (/^[0-9A-Z\-]+$/.test(key)) key = key.toLowerCase();
    if (!ctx.hasOwnProperty(key) || ctx[key] < name) ctx[key] = name;
  });

  return Object.getOwnPropertyNames(ctx).map(function(key) {
    return ctx[key];
  }).sort();
}


function ECDH(curve) {
  if (typeof curve !== 'string')
    throw new TypeError('curve should be a string');

  this._binding = new binding.ECDH(curve);
}

exports.createECDH = function createECDH(curve) {
  return new ECDH(curve);
};

ECDH.prototype.computeSecret = DiffieHellman.prototype.computeSecret;
ECDH.prototype.setPrivateKey = DiffieHellman.prototype.setPrivateKey;
ECDH.prototype.setPublicKey = DiffieHellman.prototype.setPublicKey;
ECDH.prototype.getPrivateKey = DiffieHellman.prototype.getPrivateKey;

ECDH.prototype.generateKeys = function generateKeys(encoding, format) {
  this._binding.generateKeys();

  return this.getPublicKey(encoding, format);
};

ECDH.prototype.getPublicKey = function getPublicKey(encoding, format) {
  var f;
  if (format) {
    if (typeof format === 'number')
      f = format;
    if (format === 'compressed')
      f = constants.POINT_CONVERSION_COMPRESSED;
    else if (format === 'hybrid')
      f = constants.POINT_CONVERSION_HYBRID;
      // Default
    else if (format === 'uncompressed')
      f = constants.POINT_CONVERSION_UNCOMPRESSED;
    else
      throw TypeError('Bad format: ' + format);
  } else {
    f = constants.POINT_CONVERSION_UNCOMPRESSED;
  }
  var key = this._binding.getPublicKey(f);
  encoding = encoding || exports.DEFAULT_ENCODING;
  if (encoding && encoding !== 'buffer')
    key = key.toString(encoding);
  return key;
};