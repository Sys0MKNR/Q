const sharp = require('sharp')

module.exports = function route (fastify, opts, next) {
  fastify.addHook('preHandler', (request, reply, next) => {
    if (!request.$validUser) {
      reply.unauthorized()
    }
    next()
  })

  fastify.get('/init', async (request, reply) => {
    fastify.$server.sc.start()
    reply
      .send({
        scActive: fastify.$server.sc.active,
        cropTypes: Object.keys(fastify.$server.CROP_TYPES),
        interval: fastify.$server.sc.interval
      })
  })

  fastify.get('/status', async (request, reply) => {
    reply
      .send({ scActive: fastify.$server.sc.active })
  })

  fastify.post('/status', async (request, reply) => {
    fastify.$server.sc.active = Boolean(request.body.scActive)

    if (fastify.$server.sc.active) {
      fastify.$server.sc.start()
    } else {
      fastify.$server.sc.stop()
    }
    reply
      .send('ok')
  })

  fastify.post('/exit', async (request, reply) => {
    reply
      .send('ok')
    process.exit()
  })

  fastify.post('/img', async (request, reply) => {
    try {
      if (!fastify.$server.sc.img) {
        return
      }

      fastify.$server.sc.resetCounter()

      const cropType = fastify.$server.CROP_TYPES[request.body.cropType]

      let tempImg = Buffer.from(fastify.$server.sc.img)

      if (cropType) {
        tempImg = await sharp(tempImg).extract(cropType).toBuffer()
      }

      reply
        .send({ data: tempImg.toString('base64') })
    } catch (error) {
      console.error(error)
    }
  })

  next()
}
