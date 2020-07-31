const fs = require('fs-extra')
const path = require('path')

const screenshot = require('screenshot-desktop')

const UTIL = require('./util')

const FPS = 1
const TIMEOUT = 5

class SC {
  constructor (opts) {
    const {
      fps = FPS
    } = opts

    this.fps = fps > 10 ? 10 : fps
    this.interval = Math.round(1000 / fps)
    this.img = null
    this.active = false
    this.counter = 0
    this.runner = null
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
      } catch (err) {
      }
    }
  }
}

module.exports = SC
