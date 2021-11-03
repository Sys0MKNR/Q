const Server = require('./index.js')
const qrcode = require('qrcode-terminal')
const program = require('commander')
const pkginfo = require('pkginfo')(module, 'version', 'repository')

const { version, repository } = module.exports

module.exports = null

program
  .version(version)
  .option('-d, --debug', 'output extra debugging')
  .option('-p, --port <port>', 'the used server port')
  .option('-f, --fps <fps>', 'the fps | max 30')

program.parse(process.argv)

const opts = program.opts()

const server = new Server({
  port: opts.port,
  log: opts.debug,
  fps: opts.fps
})

server.start().then(() => {

  if(!opts.debug){
    console.log('Version: ' + version)
    console.log('Log: ' + opts.debug)
    console.log('Server started at: ' + server.url)
    console.log('direct connect url: ' + server.connectUrl)
    qrcode.generate(server.connectUrl, { small: true })
    console.log('source code: ' + repository.url)
  }

}).catch(err => {
  console.error(err)
})
