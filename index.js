const { send } = require('micro')
const parseUrl = require('./utils/parseUrl')
const log = require('./utils/logger')
const response = require('./utils/responseHandler')
const router = require('./utils/router')
const { SUCCESS, ERROR, START, STOP } = require('./utils/logger').types

// example URL
// http://localhost:3000/?url=https://www.imdb.com/title/tt5758778/&instructions={ "title": ".title-wrapper h1", "The bottom part": "footer" }

module.exports = async (req, res) => {
  const { method, url } = req

  // start timer
  log.benchmark({ type: START })

  // read & parse request URL-information.
  // If a route matches, use a predetermined route instead.
  // Otherwise, simply return the user-entered URL as is into parseURL()
  const { error = false, query, instructions } = parseUrl(router({ method, url }))

  if (error) {
    if (url === '/favicon.ico' || url === '/robots.txt') {
      // each time a browser makes the request it also implicitly asks for a favicon
      // in order to not fill the logs with useless information, this will not be logged
      send(res, 200, 'ok')
      log.benchmark({ type: STOP })
    } else {
      // regular error
      send(res, 400, { error })
      const time = log.benchmark({ type: STOP })
      log.http({ type: ERROR, title: `${method} (${time})`, message: url })
    }
  } else {
    // extra desired properties from query
    const { url, purgecache = false } = query

    // load response body
    const body = await response({ url, purgecache, instructions })

    // stop timer
    const time = log.benchmark({ type: STOP })

    // send response
    send(res, 200, { delay: time, ...body })
    log.http({ type: SUCCESS, title: `${method} (${time})`, message: url })
  }
}
