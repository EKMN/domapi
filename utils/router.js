const qs = require('query-string')

const extractRoutes = ({ url }) => {
  let router = url.split('/')
  router.shift()
  return router
}

const extractParams = ({ url }) => {
  // extract the second path our URL (i.e. the query part)
  const query = url.split('?').length >= 2 && url.split('?')[1]
  let { purgecache } = qs.parse(query)

  // create custom query
  purgecache = purgecache === null || purgecache ? 'purgecache' : ''
  return purgecache && `&${purgecache}`
}

const newURL = ({ url, template, queryparams }) => {
  return `/?url=${url}&template=${template}${queryparams}`
}

const GET = ({ url, routes, queryparams }) => {
  const [ arg1, arg2 ] = routes
  switch (arg1.toUpperCase()) {
    case 'IMDB':
      // /imdb/tt5758778 will trigger this template
      const imdbID = arg2.substr(0, 9)
      return newURL({ url: `https://www.imdb.com/title/${imdbID}`, template: `imdb`, queryparams })
    default:
      // no changes, return original unmodified URL
      return url
  }
}

// Whenever our request matches a route, we return a prefilled URL
module.exports = ({ method, url }) => {
  const routes = extractRoutes({ url })
  const queryparams = extractParams({ url })
  switch (method) {
    case 'GET':
      return GET({ url, routes, queryparams })
  }
}
