const extractRoutes = ({ url }) => {
  let router = url.split('/')
  router.shift()
  return router
}

const newURL = ({ url, template }) => {
  return `/?url=${url}&template=${template}`
}

const GET = ({ url, routes }) => {
  const [ arg1, arg2 ] = routes
  if (arg1.toUpperCase() === 'IMDB') {
    // api.com/imdb/tt5758778 will trigger this template
    return newURL({ url: `https://www.imdb.com/title/${arg2}`, template: `imdb` })
  } else {
    // no changes, return original unmodified URL
    return url
  }
}

// Whenever our request matches a route, we return a prefilled URL
module.exports = ({ method, url }) => {
  const routes = extractRoutes({ url })
  switch (method) {
    case 'GET':
      return GET({ url, routes })
  }
}
