const UTIL = require('../util')
// const { Packet } = require('../data')

const { WSPacket, ImgPacket, WSError } = require('../shared/dto')

module.exports = function route (fastify, opts, next) {
  fastify.addHook('preHandler', (req, reply, next) => {
    if (!req.$validUser) {
      reply.unauthorized()
    }
    next()
  })


  fastify.post('/exit', async (req, reply) => {
    reply
      .send('ok')
    process.exit()
  })

  fastify.get('/ws', { websocket: true }, (conn, req) => {

    conn.socket.on('message', async msg => {
      try {
        const packet = new WSPacket(JSON.parse(msg))
        fastify.$server.log.info(packet)

      
        if (packet.type in WSPacket.TYPE){
          handleWS[packet.type](fastify, conn, req, packet)
        } else {
          conn.socket.send(JSON.stringify(new WSError('bad msg type')))
        }


      } catch (error) {
        conn.socket.send(JSON.stringify(new WSError('bad msg')))
        console.error(error)
      }
    })

  })

  next()
}

const handleWS = {

  async IMG (fastify, conn, req, packet) {
    const payload = packet.payload

    if(payload.type === ImgPacket.TYPE.START){
      fastify.$server.sc.addClient(conn, req)
      
    } else if(payload.type === ImgPacket.TYPE.STOP){    
      const id = req.session.get('SCClientID')
      fastify.$server.sc.removeClient(id)

    }
    

  }
}
