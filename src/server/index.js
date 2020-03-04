const path = require('path')
const util = require('util')
const crypto = require('crypto')

const screenshot = require('screenshot-desktop')
const fastify = require('fastify')
const ip = require('ip')
const selfsigned = require('selfsigned')
const fs = require('fs-extra')

const randomBytes = util.promisify(crypto.randomBytes)

const PORT = 3333
const INTERVALL = 1000

const CROP_TYPES = {
  FULL: false,
  OW_STD: { left: 809, top: 44, width: 302, height: 88 }
}

class Server {
  constructor (opts) {
    const {
      port,
      log = true,
      basePath,
      keyPath,
      certPath
    } = opts

    this.port = parseInt(port) || PORT
    this.ip = ip.address()
    this.url = `https://${this.ip}:${PORT}`
    this.log = Boolean(log)
    this.intervall = INTERVALL
    this.img = null
    this.scActive = false
    this.CROP_TYPES = CROP_TYPES

    this.basePath = basePath || path.join(process.cwd(), 'res')
    this.keyPath = keyPath || path.join(this.basePath, 'key.key')
    this.certPath = certPath || path.join(this.basePath, 'key.cert')
  }

  async sc () {
    if (this.scActive) {
      this.log.info('sc')
      try {
        this.img = await screenshot()
      } catch (err) {
        this.log.error(err)
      }
    }
  }

  initSc () {
    if (this.scs) { clearInterval(this.scs) }
    this.scs = setInterval(this.sc.bind(this), this.intervall)
  }

  async initServer () {
    this.secret = await this.randString(32, 'hex')
    this.uid = await this.randString(16, 'hex')
    this.connectUrl = `${this.url}/q/${this.uid}`

    this.keys = await this.createKeysAndCert(path)

    this.server = fastify({
      logger: this.log,
      https: {
        key: this.keys.key,
        cert: this.keys.cert
      }
    })
    this.server.decorate('$server', this)
    this.server.decorateRequest('$server', this)
    this.log = this.server.log

    this.server.register(require('fastify-rate-limit'), {
      max: 100,
      timeWindow: '1 minute'
    })

    this.server.register(require('fastify-sensible'))

    this.server.register(require('fastify-helmet'))

    this.server.register(require('fastify-secure-session'), {
      key: this.secret,
      cookie: {
        maxAge: 2592000,
        secure: true,
        path: '/'
      }
    })

    this.server.register(require('fastify-static'), {
      root: path.join(__dirname, './public'),
      prefix: '/public/'
    })

    // this.server.register(require('./guard'))

    this.server.decorateRequest('$validUser', null)

    this.server.addHook('preHandler', (request, reply, done) => {
      const token = request.session.get('token')
      const valid = Boolean(token) && (token === request.$server.uid)
      request.$validUser = valid
      done()
    })

    this.server.register(require('./route/q'), { prefix: '/q' })

    this.server.register(require('./route/api'), { prefix: '/api' })

    this.server.setNotFoundHandler((request, reply) => {
      if (request.raw.url === '/') {
        if (request.$validUser) {
          reply.redirect('/q/' + request.$server.uid)
        } else {
          reply.sendFile('html/connect.html')
        }
      } else {
        reply.notFound()
      }
    })

    this.server.setErrorHandler((error, request, reply) => {
      this.log.error(error)
      reply.internalServerError()
    })
  }

  async start () {
    this.initSc()
    await this.initServer()

    try {
      await this.server.listen(this.port, '0.0.0.0') // TODO change in prod
      this.log.info(`connect link ${this.connectUrl}`)
    } catch (err) {
      this.log.error(err)
      process.exit(1)
    }
  }

  async createKeysAndCert () {
    let key
    let cert

    const keysExist = await fs.pathExists(this.keyPath) && await fs.pathExists(this.certPath)

    if (keysExist) {
      key = await fs.readFile(this.keyPath)
      cert = await fs.readFile(this.certPath)
    } else {
      await fs.ensureDir(this.basePath)

      const result = await this.createSelfSignedCert()

      key = result.key
      cert = result.cert

      await fs.writeFile(this.keyPath, key)
      await fs.writeFile(this.certPath, cert)
    }

    return { key, cert }
  }

  createSelfSignedCert () {
    return new Promise((resolve, reject) => {
      const attrs = [{ name: 'commonName', value: 'naisu' }]

      selfsigned.generate(attrs, {
        days: 365,
        keySize: 2048,
        algorithm: 'sha256'
      }, (err, pems) => {
        if (err) { reject(err) }
        resolve({ key: pems.private, cert: pems.cert })
      })
    })
  }

  async randString (length, encoding) {
    const bytes = await randomBytes(length)
    return encoding ? bytes.toString(encoding) : bytes.toString()
  }
}

module.exports = exports = Server
