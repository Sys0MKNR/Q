const fs = require('fs-extra')
const path = require('path')

const screenshot = require('screenshot-desktop')
// const sharp = require('sharp')

// const jimp = require('jimp')

const UTIL = require('./util')
const { EventEmitter } = require('events')
const { ImgPacket } = require('./dto')

const FPS = 1
const TIMEOUT = 5


class SCClient {
  static ID = 0

  constructor(conn){
    this.id = SCClient.ID++
    this.conn = conn
    this.imgActive = false
  }

}

class SC extends EventEmitter {
  constructor (opts) {
    super()
    const {
      fps = FPS
    } = opts

    this.fps = fps > 10 ? 10 : fps
    this.interval = Math.round(1000 / fps)
    this.img = null
    this.active = false
    this.counter = 0
    this.runner = null
    this.clients = new Map()
  }

  async init () {
    if (process.pkg) {
      await fs.ensureDir(this.binaryPath)

      const files = [
        'screenCapture_1.3.2.bat',
        'app.manifest'
      ]

      const oldBinaryPath = path.resolve('node_modules/screenshot-desktop/lib/win32')

      files.forEach(async file => {
        const oldPath = path.join(oldBinaryPath, file)
        const newPath = path.join(this.binaryPath, file)

        if (!(await fs.pathExists(newPath))) {
          await UTIL.inMemCopy(oldPath, newPath)
        }
      })

      screenshot.setCWD(this.binaryPath)
    }

    this.on('sc', async ()=>{

      if(this.clients.size > 0 ){

        const img = await this.getImg()
        for(const c of this.clients.values()){
          try {            
            c.conn.socket.send(JSON.stringify(new ImgPacket({
              type: ImgPacket.TYPE.DATA,
              payload: img
            })))
          } catch (error) {
            console.error(error)
            this.removeClient(c.id)
          }
        }
      } else {
        this.stop()
      }
    })
  }

  resetCounter () {
    this.counter = 0
  }

  start () {
    if (this.active) { return }

    this.img = null
    this.active = true
    this.counter = 0

    this.runner = setInterval(this.run.bind(this), this.interval)
  }

  stop () {
    this.active = false
    if (this.runner) {
      clearInterval(this.runner)
    }
  }

  async run () {
    if (this.active) {
      this.counter++

      if ((this.counter / this.fps) > TIMEOUT) {
        this.stop()
      }

      try {
        this.img = await screenshot()
        this.emit('sc', this.img)
      } catch (err) {
      }
    }
  }

  async getImg (cropType, encoding = 'base64') {
    try {
      if (!this.img) {
        return null
      }

      this.counter = 0

      // const cropTypeDims = this.CROP_TYPES[cropType]

      const tempImg = Buffer.from(this.img)

      // if (cropType) {
        // const img = await jimp.read(tempImg)

        // tempImg = await sharp(tempImg).extract(cropTypeDims).toBuffer()
      // }

      return tempImg.toString(encoding)
    } catch (error) {
      console.error(error)
    }
  }


  async addClient(conn, req){
    const client = new SCClient(conn)
    this.clients.set(client.id, client)
    req.session.set('SCClientID', client.id)
    this.start()
    
  }

  async removeClient(clientID){
    this.clients.delete(clientID)
  } 



}

module.exports = SC
