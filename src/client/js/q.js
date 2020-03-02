let _imageLoader
let _loadImage = false
let _img
const _interval = 1000
let _toggleBtn
let _tries = 5

window.addEventListener('DOMContentLoaded', async event => {
  const res = await fetch('/api/init')
  const { scActive, url, interval } = await res.json()

  console.log({ scActive, url, interval })

  _loadImage = scActive
  _toggleBtn = document.getElementById('toggle')
  _toggleBtn.textContent = toggleButtonText()

  _toggleBtn.addEventListener('click', async e => {
    setStatus(!_loadImage)

    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scActive: _loadImage })
      })

      const data = await res.status()
    } catch (error) {
      console.error(error)
    }
  })

  document.getElementById('exit').addEventListener('click', async e => {
    const res = await fetch('/api/exit', {
      method: 'POST'
    })
  })

  _img = document.getElementById('img')

  _imageLoader = getImg()
})

function setStatus (newStatus) {
  _loadImage = newStatus

  _toggleBtn.textContent = toggleButtonText()

  if (_loadImage) {
    resetTries()
    _imageLoader = getImg()
  } else clearInterval(_imageLoader)
}

function getImg () {
  return setInterval(async () => {
    console.log(_tries)
    if (!_loadImage) return

    if (_tries <= 0) {
      setStatus(false)
      return
    }

    try {
      const res = await fetch('/api/img', {
        method: 'POST'
      })

      const json = await res.json()
      console.log(json.data)
      _img.setAttribute('src', 'data:image/jpeg;base64,' + json.data)
      resetTries()
    } catch (error) {
      _tries--
      console.error(error)
    }
  }, _interval)
}

function resetTries () {
  _tries = 5
}

function toggleButtonText () {
  return _loadImage ? 'Stop' : 'Start'
}
