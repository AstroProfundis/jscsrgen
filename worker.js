// Generated by CoffeeScript 1.8.0
var BITSTR, DERNULL, INTERGER, OID, PRTSTR, SEQUENCE, SET, TAG, UTF8STR, asn1Util, cryptoUtil, generateCSR, generateKeyPair, j, keyUtil, onmessage;

postMessage({
  type: 'status',
  message: 'Importing JSRSASign library ...'
});

importScripts('jsrsasign-4.7.0-all-min.js');

j = KJUR;

keyUtil = KEYUTIL;

asn1Util = j.asn1.ASN1Util;

cryptoUtil = j.crypto.Util;

SEQUENCE = function(arr) {
  return new j.asn1.DERSequence({
    'array': arr
  });
};

SET = function(arr) {
  return new j.asn1.DERSet({
    'array': arr
  });
};

INTERGER = function(num) {
  return new j.asn1.DERInteger({
    'int': num
  });
};

PRTSTR = function(str) {
  return new j.asn1.DERPrintableString({
    'str': str
  });
};

UTF8STR = function(str) {
  return new j.asn1.DERUTF8String({
    'str': str
  });
};

BITSTR = function(hex) {
  return new j.asn1.DERBitString({
    'hex': hex
  });
};

OID = function(oid) {
  return j.asn1.x509.OID.name2obj(oid);
};

TAG = function(tag) {
  return new j.asn1.DERTaggedObject({
    'tag': tag || 'a0'
  });
};

DERNULL = function() {
  return new j.asn1.DERNull();
};

generateKeyPair = function(len) {
  var keyPair, privateKeyHex, privateKeyObj, privateKeyPEM, publicKeyHex, publicKeyObj, publicKeyPEM, ret, tbl;
  ret = {};
  tbl = [324, 588];
  keyPair = keyUtil.generateKeypair("RSA", len);
  privateKeyObj = ret.privateKeyObj = keyPair.prvKeyObj;
  publicKeyObj = ret.publicKeyObj = keyPair.pubKeyObj;
  privateKeyObj.isPrivate = true;
  privateKeyPEM = ret.privateKeyPEM = keyUtil.getPEM(privateKeyObj, "PKCS8PRV");
  privateKeyHex = ret.privateKeyHex = keyUtil.getHexFromPEM(privateKeyPEM, "PRIVATE KEY");
  publicKeyPEM = ret.publicKeyPEM = keyUtil.getPEM(publicKeyObj);
  publicKeyHex = ret.publicKeyHex = keyUtil.getHexFromPEM(publicKeyPEM, "PUBLIC KEY");
  if (tbl.indexOf(ret.publicKeyHex.length) === -1) {
    return false;
  }
  return ret;
};

generateCSR = function(data, keyPair, alg) {
  var certificateRequestInfo, sig;
  alg = alg || 'SHA256withRSA';
  certificateRequestInfo = SEQUENCE([INTERGER(0), SEQUENCE([SET([SEQUENCE([OID("countryName"), PRTSTR(data.countryName)])]), SET([SEQUENCE([OID("stateOrProvinceName"), UTF8STR(data.stateOrProvinceName)])]), SET([SEQUENCE([OID("locality"), UTF8STR(data.locality)])]), SET([SEQUENCE([OID("organization"), UTF8STR(data.organization)])]), SET([SEQUENCE([OID("commonName"), UTF8STR(data.commonName)])])]), new j.asn1.x509.SubjectPublicKeyInfo(keyPair.publicKeyObj), TAG()]);
  sig = new j.crypto.Signature({
    alg: alg
  });
  sig.init(keyPair.privateKeyPEM);
  sig.updateHex(certificateRequestInfo.getEncodedHex());
  return SEQUENCE([certificateRequestInfo, SEQUENCE([OID(alg), DERNULL()]), BITSTR('00' + sig.sign())]);
};

onmessage = function(e) {
  var CSR, CSRPEM, data, keyPair;
  data = e.data.workload;
  postMessage({
    type: 'status',
    message: 'Generating private key ...'
  });
  keyPair = false;
  while (1) {
    keyPair = generateKeyPair(parseInt(data.keySize));
    if (keyPair === false) {
      postMessage({
        type: 'status',
        message: 'Regenerating private key ...'
      });
    } else {
      break;
    }
  }
  postMessage({
    type: 'status',
    message: 'Generating CSR ...'
  });
  CSR = generateCSR(data, keyPair, "SHA256withRSA");
  postMessage({
    type: 'status',
    message: 'Converting CSR to PEM format ...'
  });
  CSRPEM = asn1Util.getPEMStringFromHex(CSR.getEncodedHex(), "CERTIFICATE REQUEST");
  postMessage({
    type: 'private',
    pem: keyPair.privateKeyPEM
  });
  postMessage({
    type: 'csr',
    pem: CSRPEM
  });
  return postMessage({
    type: 'done'
  });
};
