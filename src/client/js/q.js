
let _fetchImg = false
let _img
let _toggleBtn
let _socket


window.addEventListener('DOMContentLoaded', async event => {
  connectToWs()

  _toggleBtn = document.getElementById('toggle')
  _toggleBtn.textContent = toggleButtonText()

  _toggleBtn.addEventListener('click', async e => {
    if(_fetchImg){
      stopImgFetch()
    } else {
      startImgFetch()
    }
    setStatus(!_fetchImg)
 
  })

  // document.getElementById('exit').addEventListener('click', async e => {
  //   await fetch('/api/exit', {
  //     method: 'POST'
  //   })
  // })

})


function connectToWs(){
  const loc = window.location
  const wssUri = `${loc.origin.replace('http', 'ws')}/api/ws`

  _socket = new WebSocket(wssUri)
  _img = document.getElementById('img')

  _socket.addEventListener('open', function (event) {
    console.log('connected to ws')

    startImgFetch()
    setStatus(true)

  })

  // Listen for messages
  _socket.addEventListener('message', function (event) {
      console.log('Message from server ', event.data)

      const packet = JSON.parse(event.data)

      if(packet.type === 'data'){
        _img.setAttribute('src', 'data:image/jpeg;base64,' + packet.payload)
      }
  })

  _socket.addEventListener('error', err=>{
    console.error(err)
  })

  
  _socket.addEventListener('close', ()=>{
    console.log('close')
  })

}


function startImgFetch(){

  sendJSONoverSocket({
    type: 'IMG',
    payload: {
      type: 'start'
    }
  })

}


function stopImgFetch(){
  sendJSONoverSocket({
    type: 'IMG',
    payload: {
      type: 'stop'
    }
  })
}


function sendJSONoverSocket(data){
  _socket.send(JSON.stringify(data))
}


function setStatus (newStatus) {
  _fetchImg = newStatus
  _toggleBtn.textContent = toggleButtonText()
}



function toggleButtonText () {
  return _fetchImg ? 'Stop' : 'Start'
}
