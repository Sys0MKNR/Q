class Client {
  constructor (opts) {
    const {
      uid,
      ws
    } = opts
    this.uid = uid
    this.ws = ws
  }
}

class InitData {
  constructor (opts) {
    const {
      active,
      cropTypes,
      interval,
      clientUID
    } = opts

    this.active = active
    this.cropTypes = cropTypes
    this.interval = interval
    this.clientUID = clientUID
  }
}

class Packet {
  constructor (opts) {
    const {
      type,
      data
    } = opts

    this.type = type
    this.data = data
  }
}

module.exports = {
  Client,
  InitData,
  Packet
}
