const sharp = require('sharp')

module.exports = function route (fastify, opts, next) {
  fastify.addHook('preHandler', (request, reply, next) => {
    if (!request.$validUser) {
      reply.unauthorized()
    }
    next()
  })

  fastify.get('/init', async (request, reply) => {
    fastify.$server.scActive = true
    reply
      .send({
        scActive: fastify.$server.scActive,
        cropTypes: Object.keys(fastify.$server.CROP_TYPES),
        interval: fastify.$server.interval
      })
  })

  fastify.get('/status', async (request, reply) => {
    reply
      .send({ scActive: fastify.$server.scActive })
  })

  fastify.post('/status', async (request, reply) => {
    fastify.$server.scActive = Boolean(request.body.scActive)
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
      if (!fastify.$server.img) {
        return
      }

      const cropType = fastify.$server.CROP_TYPES[request.body.cropType]

      let tempImg = Buffer.from(fastify.$server.img)

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
