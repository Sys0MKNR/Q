const Server = require('./index.js')
const qrcode = require('qrcode-terminal')

const server = new Server({
  port: 3333,
  log: true
})

server.start().then(() => {
  console.log('Server started at: ' + server.url)
  console.log('direct connect url: ' + server.connectUrl)
  qrcode.generate(server.connectUrl, { small: true })
}).catch(err => {
  console.error(err)
})
