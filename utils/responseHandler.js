const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const { minify } = require('html-minifier')
const sha256 = require('sha256')
const prettyMs = require('pretty-ms')

const log = require('./logger')
const scrapeDom = require('./scrapeDom')
const makeRequest = require('./makeRequest')

// cache validity in seconds
const CACHE_EXPIRE = 60 * 60

// response cache cooldown in minutes
const CACHE_COOLDOWN = 5

// amount of cache purges to trigger cooldown
const CACHE_PURGE_LIMIT = 5

const notExpired = ({ timestamp = false } = {}) => {
  // exit if no timestamp
  if (!timestamp) {
    return false
  }

  // check that our timestamp is not older than CACHE_EXPIRE seconds
  const currentTime = +new Date()
  const oldTime = timestamp
  return Math.floor((currentTime - oldTime) / 1000) <= CACHE_EXPIRE
}

const handleCooldown = async ({ urlhash, db }) => {
  let state = (await db.get('cache').find({ urlhash }).value()) || {}
  let cooldown = {}

  // cooldown properties
  const now = +new Date()
  cooldown.active = state.freezeActive || false
  cooldown.expired = state.freezeDuration ? state.freezeDuration <= now : false
  cooldown.limitReached = state.purgeAttempts >= CACHE_PURGE_LIMIT
  cooldown.timeRemaining =
    Math.sign(state.freezeDuration - now) !== -1 ? prettyMs(state.freezeDuration - now) : 'calculating...'

  // cooldown method
  cooldown.activate = () => {
    const freezeDuration = +new Date(new Date().getTime() + 1 * CACHE_COOLDOWN * 60 * 1000)
    db.get('cache').find({ urlhash }).assign({ freezeDuration, freezeActive: true }).write()
  }

  // cooldown method
  cooldown.reset = () => {
    db.get('cache').find({ urlhash }).assign({ purgeAttempts: 0, freezeDuration: false, freezeActive: false }).write()
  }

  // cooldown method
  cooldown.increase = () => {
    db
      .get('cache')
      .find({ urlhash })
      .update('purgeAttempts', (attempts = 0) => {
        if (attempts < CACHE_PURGE_LIMIT) {
          return attempts + 1
        } else {
          return CACHE_PURGE_LIMIT
        }
      })
      .write()
  }

  // this is the first time we're fethcing the item. Exit and return defaults.
  if (!Object.keys(state).length) {
    return {
      cooldownActive: false,
      timeRemaining: 0
    }
  }

  if (cooldown.limitReached && !cooldown.active) {
    cooldown.activate()
    log.generic({ type: 'DEBUG', title: 'CACHE-CONTROL', message: 'cache purge cooldown activated' })
    return {
      isActive: true,
      timeRemaining: cooldown.timeRemaining
    }
  } else if (cooldown.expired) {
    cooldown.reset()
    log.generic({ type: 'DEBUG', title: 'CACHE-CONTROL', message: 'cache purge cooldown reset' })
    return {
      isActive: false,
      timeRemaining: 0
    }
  } else if (cooldown.limitReached && cooldown.active) {
    // cooldown request limit reached, cooldown is not active, cooldown has not expired
    // i.e. this should be triggered each time during the cooldown period
    return {
      isActive: true,
      timeRemaining: cooldown.timeRemaining
    }
  } else {
    cooldown.increase()
    return {
      isActive: false,
      timeRemaining: 0
    }
  }
}

const refreshCache = async ({ db, url, instructions, urlhash, reason }) => {
  // why we are refreshing caches
  log.generic({ type: 'DEBUG', title: 'CACHE-CONTROL', message: reason })

  // defaults
  let throttleReason = 'purge denied: request limit reached'
  let cooldownActive = false
  let cooldownDuration = ''
  let version = 'cache'

  // handle cooldown
  if (reason === 'purge request') {
    const cooldown = await handleCooldown({ urlhash, db })
    cooldownActive = cooldown.isActive
    cooldownDuration = cooldown.timeRemaining
  }

  // look for a matching response
  const hitExists = await db.get('cache').find({ urlhash }).value()

  // is cooldown is active and we have a cache hit stored
  // serve the cache hit instead and ignore the cache purge request
  if (cooldownActive && hitExists) {
    const { dom } = hitExists
    log.generic({ type: 'DEBUG', title: 'CACHE-CONTROL', message: throttleReason })
    return { url, version, throttleReason, throttleDuration: cooldownDuration, dom }
  }

  // fetch target body
  const rawBody = await makeRequest(url)

  // minify body
  const body = minify(rawBody)

  // create our vdom model
  const dom = scrapeDom({ body, instructions })

  // create timestamp (now)
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
    log.generic({ type: 'DEBUG', title: 'CACHE-CONTROL', message: 'cache hit' })
    return { url, version: 'cache', dom: hit.dom }
  } else {
    return refreshCache({ db, url, instructions, urlhash, reason: 'cache miss' })
  }
}
