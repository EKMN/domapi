const qs = require('query-string')

const extractRoutes = ({ url }) => {
  let router = url.split('/')
  router.shift()
  return router
}

const extractParams = ({ url }) => {
  // extract the second path our URL (i.e. the query part)
  const query = url.split('?').length >= 2 && url.split('?')[1]
  const { purgecache } = qs.parse(query)
  return {
    purgecache: purgecache === null || purgecache ? 'purgecache' : ''
  }
}

const newURL = ({ url, template, purgecache }) => {
  return `/?url=${url}&template=${template}&${purgecache}`
}

const GET = ({ url, routes, purgecache }) => {
  const [ arg1, arg2 ] = routes
  if (arg1.toUpperCase() === 'IMDB') {
    // api.com/imdb/tt5758778 will trigger this template
    return newURL({ url: `https://www.imdb.com/title/${arg2}`, template: `imdb`, purgecache })
  } else {
    // no changes, return original unmodified URL
    return url
  }
}

// Whenever our request matches a route, we return a prefilled URL
module.exports = ({ method, url }) => {
  const routes = extractRoutes({ url })
  const { purgecache = false } = extractParams({ url })
  switch (method) {
    case 'GET':
      return GET({ url, routes, purgecache })
  }
}
