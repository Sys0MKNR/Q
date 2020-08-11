const crypto = require('crypto')
const util = require('util')

const fs = require('fs-extra')

const randomBytes = util.promisify(crypto.randomBytes)

module.exports = {

  inMemCopy (source, target) {
    fs.createReadStream(source).pipe(fs.createWriteStream(target))
  },

  async randString (length, encoding) {
    const bytes = await randomBytes(length)
    return encoding ? bytes.toString(encoding) : bytes.toString()
  }

}
