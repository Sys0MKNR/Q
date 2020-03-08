const Server = require('./index.js')
const qrcode = require('qrcode-terminal')
const program = require('commander')

program
  .option('-d, --debug', 'output extra debugging')
  .option('-p, --port <port>', 'port')

program.parse(process.argv)

const server = new Server({
  port: program.port,
  log: program.debug
})

server.start().then(() => {
  console.log('Server started at: ' + server.url)
  console.log('direct connect url: ' + server.connectUrl)
  qrcode.generate(server.connectUrl, { small: true })
}).catch(err => {
  console.error(err)
})
