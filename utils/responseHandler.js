const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const { minify } = require('html-minifier')
const sha256 = require('sha256')

const scrapeDom = require('./scrapeDom')
const makeRequest = require('./makeRequest')

// cache validity in seconds
const CACHE_EXPIRE = 60 * 60

const notExpired = ({ timestamp = false } = {}) => {
  // exit if no timestamp
  if (!timestamp) {
    return false
  }

  // check that our timestamp is not older than 30 seconds
  const currentTime = +new Date()
  const oldTime = timestamp
  return Math.floor((currentTime - oldTime) / 1000) <= CACHE_EXPIRE
}

const refreshCache = async ({ db, url, instructions, urlhash, reason }) => {
  // why we are refreshing caches
  console.log(reason)

  // fetch target body
  const rawBody = await makeRequest(url)

  // minify body
  const body = minify(rawBody)

  // look for a match response
  const hitExists = await db.get('cache').find({ urlhash }).value()

  // craft our vdom model
  const dom = scrapeDom({ body, instructions })

  // we create timestamp for our cache
  const timestamp = +new Date()

  // async create/update cache entries (no need to await)
  if (hitExists) {
    // update hit
    db.get('cache').find({ urlhash }).assign({ urlhash, dom, timestamp }).write()
  } else {
    // create new hit
    db.get('cache').push({ urlhash, dom, timestamp }).write()
  }

  return { url, version: 'live', dom }
}

// TODO make a cron that removes all expired entries (each hour or so)

module.exports = async ({ url, instructions, purgecache }) => {
  // save response contents along with a timestamp
  // when a request to the same URL occurs, check if the timestamp is older than CACHE_EXPIRE seconds
  // if the timestamp is not older than CACHE_EXPIRE seconds, re-request, if not, serve the cached version instantly and refresh the contents with an updated timestamp
  // (valid for another CACHE_EXPIRE seconds)

  // wait for our filesystem
  const adapter = new FileAsync('db.json')
  const db = await low(adapter)

  // set DB defaults (applied if default entries don't already exist)
  db.defaults({ cache: [] }).write()

  // generate a hash of the URL
  const urlhash = sha256(url)

  // read DB for matching entry
  const hit = await db.get('cache').find({ urlhash }).value()

  // serve a fresh response and update cache if the request is explicitly set to purge
  if (purgecache) {
    return refreshCache({ db, url, instructions, urlhash, reason: 'purge request' })
  }

  if (hit && notExpired(hit)) {
    console.log('cache hit')
    return { url, version: 'cache', dom: hit.dom }
  } else {
    return refreshCache({ db, url, instructions, urlhash, reason: 'cache miss' })
  }
}
