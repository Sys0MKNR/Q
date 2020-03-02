const selfsigned = require('selfsigned')

var attrs = [{ name: 'commonName', value: 'naisu' }]
var pems = selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048,
  algorithm: 'sha256'
})

console.log(pems)
