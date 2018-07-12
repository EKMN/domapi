const urlIsValid = require('./validateUrl')
const qs = require('query-string')
const template = require('./templates')

module.exports = (url) => {
  // removes leading /
  const query = qs.parse(url.substr(1))

  // if purgecache query param is set, make it true
  if (query.purgecache === null || typeof query.purgecache === 'string') {
    query.purgecache = true
  }

  if (!query.url) {
    return {
      error: 'Invalid query parameter. Missing: "url"-option'
    }
  }

  if (!urlIsValid(query.url)) {
    return {
      error: 'Invalid URL-format'
    }
  }

  // instead of doing this, look at the root domain, e.g. if the root domain is "imdb", use template.IMDB automagically.
  // use template
  if (query.template) {
    switch (query.template.toUpperCase()) {
      case 'IMDB':
        return {
          query,
          instructions: template.IMDB
        }
      default:
        return {
          error: 'Invalid template. Please use a valid template name'
        }
    }
  }

  // or use instructions
  if (!query.instructions) {
    return {
      error: 'Invalid query parameter. Missing: "instructions"-option'
    }
  }

  try {
    // check if instructions are valid JSON
    const instructions = JSON.parse(query.instructions)

    return {
      query,
      instructions
    }
  } catch (e) {
    console.log(e)
    return {
      error: 'Invalid JSON. Make sure the query parameter "instructions" contains valid JSON'
    }
  }
}
