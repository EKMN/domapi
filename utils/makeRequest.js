const fetch = require('node-fetch')

module.exports = async (url) => {
  if (!url) {
    return
  }

  try {
    const contents = await fetch(url)
    return contents.text()
  } catch (e) {
    console.log(e)
    return {
      error: `Failed to make a request to ${url}`
    }
  }
}
