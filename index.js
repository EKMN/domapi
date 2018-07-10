const { send } = require('micro')
const makeRequest = require('./utils/makeRequest')
const scrapeDom = require('./utils/scrapeDom')
const parseUrl = require('./utils/parseUrl')
const log = require('./utils/logger')
const { SUCCESS, ERROR, START, STOP } = require('./utils/logger').types

// example URL
// http://localhost:3000/?url=https://www.imdb.com/title/tt5758778/&instructions={ "title": ".title-wrapper h1", "The bottom part": "footer" }

module.exports = async (req, res) => {
  const { method, url } = req

  log.benchmark({ type: START })

  // read & parse request URL-information
  const { error = false, query, instructions } = parseUrl(url)

  if (error) {
    send(res, 400, { error })

    const time = log.benchmark({ type: STOP })
    log.http({ type: ERROR, title: `${method} (${time})`, message: url })
  } else {
    // load target body
    const body = await makeRequest(query.url)

    // scrape response body
    const dom = scrapeDom({ body, instructions })

    send(res, 200, { dom })

    const time = log.benchmark({ type: STOP })
    log.http({ type: SUCCESS, title: `${method} (${time})`, message: url })
  }
}
