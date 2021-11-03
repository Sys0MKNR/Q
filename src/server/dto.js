class Packet{

  constructor(opts){
    const {
      type, 
      payload
    } = opts
    this.type = type
    this.payload = payload
  }
}


class WSPacket extends Packet{

  static TYPE = {
    'ERROR': 'error',
    'IMG': 'img',
    'STATUS': 'status'
  }

  constructor(opts){
   super(opts)
  }

  
}



class WSError extends WSPacket{
  constructor(payload){
    super({
      type: WSPacket.TYPE.ERROR,
      payload
    })

  }
}


class ImgPacket extends Packet{
  static TYPE = {
    'START': 'start',
    'STOP': 'stop',
    'DATA': 'data'
  }

  constructor(opts){
    super(opts)
  }
}



module.exports = {
  WSPacket,
  WSError,
  Packet,
  ImgPacket
}
