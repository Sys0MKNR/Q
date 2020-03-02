const Server = require('./src/')

const server = new Server({
  port: 3333
})

server.start()
