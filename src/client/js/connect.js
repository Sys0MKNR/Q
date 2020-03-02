window.addEventListener('DOMContentLoaded', async event => {
  console.log(window.location.href)

  const connectBtn = document.getElementById('connect')
  const urlIn = document.getElementById('url')

  connectBtn.addEventListener('click', async e => {
    const url = urlIn.value
    let relUrl = url.replace(window.location.href, '')
    relUrl = relUrl.replace('q/', '')
    relUrl = '/q/' + relUrl

    const res = await fetch(relUrl, {
      method: 'POST'
    })

    console.log(res.status)

    if (res.status === 200) {
      window.location.href = relUrl
    } else {
      alert('err')
    }
  })
})
