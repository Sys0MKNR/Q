
module.exports = function route (fastify, opts, next) {
  fastify.get('/:token', async function (request, reply) {
    const { token } = request.params

    if (fastify.$server.uid === token) {
      if (!request.$validUser) {
        request.session.set('token', fastify.$server.uid)
      }
      reply.sendFile('html/q.html')
    } else if (request.$validUser) {
      reply.redirect('/q/' + fastify.$server.uid)
    } else {
      reply.redirect('/')
    }
  })

  fastify.post('/:token', async function (request, reply) {
    const { token } = request.params
    if (fastify.$server.uid === token) {
      if (!request.$validUser) {
        request.session.set('token', fastify.$server.uid)
      }
      reply.send('ok')
    } else {
      reply.unauthorized()
    }
  })

  next()
}
