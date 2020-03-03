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
        scActive: fastify.$server.scActive
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
    process.exit()
  })

  fastify.post('/img', async (request, reply) => {
    if (!fastify.$server.img) {
      return
    }

    const cropType = fastify.$server.CROP_TYPES[request.body.cropType]

    let tempImg = Buffer.from(fastify.$server.img)

    if (cropType) {
      try {
        tempImg = await sharp(tempImg).extract(cropType).toBuffer()
      } catch (error) {

      }
    }

    reply
      .send({ data: tempImg.toString('base64') })
  })

  next()
}
