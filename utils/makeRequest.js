const fetch = require('node-fetch')

module.exports = async (url) => {
  if (!url) {
    return
  }

  try {
    const body = await fetch(url)
    return body.text()
  } catch (e) {
    console.log(e)
    return {
      error: `Failed to make a request to ${url}`
    }
  }
}
