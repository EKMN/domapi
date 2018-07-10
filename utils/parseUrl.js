const urlIsValid = require('./validateUrl')
const qs = require('query-string')

module.exports = (url) => {
  // removes leading /
  const query = qs.parse(url.substr(1))

  if (!query.instructions) {
    return {
      error: 'Invalid query parameter. Missing: "instructions"-option'
    }
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

  try {
    // check if instructions are valid JSON
    const instructions = JSON.parse(query.instructions)

    return {
      query,
      instructions
    }
  } catch (e) {
    return {
      error: 'Invalid JSON. Make sure the query parameter "instructions" contains valid JSON'
    }
  }
}
