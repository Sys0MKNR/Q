const path = require('path')
const util = require('util')
const crypto = require('crypto')

const screenshot = require('screenshot-desktop')
const fastify = require('fastify')
const ip = require('ip')
const selfsigned = require('selfsigned')
const fs = require('fs-extra')
const envPaths = require('env-paths')
const SC = require('./sc')

const UTIL = require('./util')

const paths = envPaths('Q', { suffix: '' })

const PORT = 36111
const FPS = 1

const CROP_TYPES = {
  FULL: false,
  OW_STD: { left: 809, top: 44, width: 302, height: 88 }
}

class Server {
  constructor (opts) {
    const {
      port,
      log = false,
      fps = FPS

    } = opts

    this.port = parseInt(port) || PORT
    this.ip = ip.address()
    this.url = `https://${this.ip}:${this.port}`
    this.log = Boolean(log)

    this.sc = new SC({ fps })
    this.CROP_TYPES = CROP_TYPES

    this.paths = paths
    this.binaryPath = path.join(this.paths.data, 'bin')
    this.httpsPath = path.join(this.paths.data, 'https')

    this.clients = new Map()
  }

  async initServer () {
    this.secret = await UTIL.randString(32, 'hex')
    this.salt = await UTIL.randString(8, 'hex')
    this.uid = await UTIL.randString(16, 'hex')
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
      keyGenerator (req) { return req.$validUser },
      max: (req, key) => { return key ? 10000 : 100 },
      timeWindow: '1 minute'
    })

    this.server.register(require('fastify-sensible'))

    this.server.register(require('fastify-helmet'))

    this.server.register(require('fastify-secure-session'), {
      secret: this.secret,
      salt: this.salt,
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

    this.server.decorateRequest('$validUser', null)

    this.server.addHook('preHandler', (req, reply, done) => {
      const token = req.session.get('token')
      const valid = Boolean(token) && (token === req.$server.uid)
      req.$validUser = valid
      done()
    })

    this.server.register(require('./route/q'), { prefix: '/q' })
    this.server.register(require('./route/api'), { prefix: '/api' })

    fastify.register(require('fastify-websocket'), {
      options: {
        verifyClient: (info, next) => {
          return next(info.req.req.$validUser)
        }
      }
    })

    this.server.setNotFoundHandler((req, reply) => {
      if (req.raw.url === '/') {
        if (req.$validUser) {
          reply.redirect('/q/' + req.$server.uid)
        } else {
          reply.sendFile('html/connect.html')
        }
      } else {
        reply.notFound()
      }
    })

    this.server.setErrorHandler((error, req, reply) => {
      this.log.error(error)
      reply.internalServerError()
    })
  }

  async start () {
    await fs.ensureDir(this.paths.data)

    await this.sc.init()
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
    await fs.ensureDir(path.join(this.httpsPath))

    const keyPath = path.join(this.httpsPath, 'https.key')
    const certPath = path.join(this.httpsPath, 'https.cert')

    let key
    let cert

    const keysExist = await fs.pathExists(keyPath) && await fs.pathExists(certPath)

    if (keysExist) {
      key = await fs.readFile(keyPath)
      cert = await fs.readFile(certPath)
    } else {
      const result = await this.createSelfSignedCert()

      key = result.key
      cert = result.cert

      await fs.writeFile(keyPath, key)
      await fs.writeFile(certPath, cert)
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
