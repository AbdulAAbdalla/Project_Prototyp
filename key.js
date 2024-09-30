const crypto = require('crypto');

//create a 32-byte key for AES 256 CBC
const key = crypto.randomBytes(32).toString('hex');

console.log('Encryption key:', key);