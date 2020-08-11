const UTIL = require('../util')
const { Packet } = require('../data')

module.exports = function route (fastify, opts, next) {
  fastify.addHook('preHandler', (req, reply, next) => {
    if (!req.$validUser) {
      reply.unauthorized()
    }
    next()
  })

  fastify.get('/init', async (req, reply) => {
    fastify.$server.sc.start()
    reply
      .send({
        scActive: fastify.$server.sc.active,
        cropTypes: Object.keys(fastify.$server.CROP_TYPES),
        interval: fastify.$server.sc.interval

      })
  })

  fastify.get('/status', async (req, reply) => {
    reply
      .send({ scActive: fastify.$server.sc.active })
  })

  fastify.post('/status', async (req, reply) => {
    reply
      .send('ok')
  })

  fastify.post('/exit', async (req, reply) => {
    reply
      .send('ok')
    process.exit()
  })

  fastify.post('/ws', { websocket: true }, async (conn, req) => {
    conn.socket.on('message', async msg => {
      try {
        const packet = JSON.parse(msg)
        handleWS[packet.cmd](fastify, conn, packet)
      } catch (error) {

      }
    })
  })

  next()
}

const handleWS = {
  async STATUS_GET (fastify, conn, packet) {
    conn.socket.send(new Packet({
      type: 'STATUS_GET',
      data: fastify.$server.sc.active
    }))
  },
  async STATUS_SET (fastify, conn, packet) {
    fastify.$server.sc.active = Boolean(packet.data)
    if (fastify.$server.sc.active) {
      fastify.$server.sc.start()
    } else {
      fastify.$server.sc.stop()
    }
  },
  async IMG (fastify, conn, packet) {
    console.log(conn)
    console.log(conn.socket)
  }
}
