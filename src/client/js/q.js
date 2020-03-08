let _imageLoader
let _loadImage = false
let _img
let _interval = 1000
let _toggleBtn
let _tries = 5
let _cropTypeSelect
let _cropType = 'FULL'

window.addEventListener('DOMContentLoaded', async event => {
  const res = await fetch('/api/init')

  if (res.status !== 200) { return }

  const { scActive, url, interval, cropTypes } = await res.json()

  console.log({ scActive, url, interval, cropTypes })

  _loadImage = scActive
  _interval = interval || 1000
  _toggleBtn = document.getElementById('toggle')
  _toggleBtn.textContent = toggleButtonText()
  _cropTypeSelect = document.getElementById('cropTypes')

  _cropTypeSelect.addEventListener('change', e => {
    _cropType = e.target.value
  })

  cropTypes.forEach(x => {
    const option = document.createElement('option')
    option.text = x
    _cropTypeSelect.add(option)
  })

  _toggleBtn.addEventListener('click', async e => {
    setStatus(!_loadImage)

    try {
      await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scActive: _loadImage })
      })
    } catch (error) {
      setStatus(false)
      console.error(error)
    }
  })

  document.getElementById('exit').addEventListener('click', async e => {
    await fetch('/api/exit', {
      method: 'POST'
    })
  })

  _img = document.getElementById('img')

  _imageLoader = getImgWorker()
})

function setStatus (newStatus) {
  _loadImage = newStatus
  _toggleBtn.textContent = toggleButtonText()

  if (_loadImage) {
    resetTries()
    _imageLoader = getImgWorker()
  } else clearInterval(_imageLoader)
}

function getImgWorker () {
  getImg()
  return setInterval(getImg, _interval)
}

async function getImg () {
  if (!_loadImage) return

  if (_tries <= 0) {
    setStatus(false)
    return
  }

  try {
    const res = await fetch('/api/img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cropType: _cropType })
    })

    const json = await res.json()

    if (res.status === 200) {
      _img.setAttribute('src', 'data:image/jpeg;base64,' + json.data)
      resetTries()
    } else { throw new Error('not 200') }
  } catch (error) {
    _tries--
    console.error(error)
  }
}

function resetTries () {
  _tries = 5
}

function toggleButtonText () {
  return _loadImage ? 'Stop' : 'Start'
}
