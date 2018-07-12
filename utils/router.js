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
  if (arg1.toUpperCase() === 'IMDB') {
    // api.com/imdb/tt5758778 will trigger this template
    return newURL({ url: `https://www.imdb.com/title/${arg2}`, template: `imdb`, queryparams })
  } else {
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

// TODO (1/4) currently invalid routes, e.g. /imdb/tt5758776?purg will create a cache hit, as "tt5758776?purg" will be sent as the last
// TODO (2/4) part of the URL to imdb, i.e. the end URL will look like this: "https://www.imdb.com/title/tt5758776?purg"
// TODO (3/4) find a clean way to remove invalid query parameters. Proper parameters, as expected, should be as follows:
// TODO (4/4) "/imdb/tt5758776/?purg" or as the valid version (purg is intentionally misspelled): "/imdb/tt5758776/?purgecache"
