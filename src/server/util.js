const fs = require('fs-extra')

module.exports = {

  inMemCopy (source, target) {
    fs.createReadStream(source).pipe(fs.createWriteStream(target))
  }

}
