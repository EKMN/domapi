const chalk = require('chalk')
const figures = require('figures')
const tick = require('performance-now')
const prettyMs = require('pretty-ms')

const SUCCESS = 'SUCCESS'
const DEBUG = 'DEBUG'
const PENDING = 'PENDING'
const ERROR = 'ERROR'

const START = 'START'
const STOP = 'STOP'

const log = {}

log.create = ({ symbol, color }) => ({ prefix, message }) =>
  console.log(`${chalk[color](`${symbol} ${prefix}`)} ${chalk(message)}`)
log.error = log.create({ symbol: figures.cross, color: 'red' })
log.success = log.create({ symbol: figures.tick, color: 'green' })
log.default = log.create({ symbol: figures.info, color: 'yellowBright' })

const SUCCESS_LOG = ({ prefix, message }) => log.success({ prefix, message })
const DEBUG_LOG = ({ prefix, message }) => log.default({ prefix, message })
const PENDING_LOG = ({ prefix, message }) => log.default({ prefix, message })
const ERROR_LOG = ({ prefix, message }) => log.error({ prefix, message })

log.template = ({ type, prefix, message }) => {
  switch (type) {
    case SUCCESS:
      SUCCESS_LOG({ prefix, message })
      break
    case DEBUG:
      DEBUG_LOG({ prefix, message })
      break
    case PENDING:
      PENDING_LOG({ prefix, message })
      break
    case ERROR:
      ERROR_LOG({ prefix, message })
      break
  }
}

log.http = ({ type, title, message }) => log.template({ type, message, prefix: `[HTTP] ${title}:` })
log.generic = ({ type, title, message }) => log.template({ type, message, prefix: `[GENERIC] ${title}:` })
log.benchmark = ({ type }) => {
  const tock = tick
  switch (type) {
    case START:
      log.benchmark.start = tick()
      break
    case STOP:
      log.benchmark.end = tock()
      return prettyMs(log.benchmark.end - log.benchmark.start)
  }
}

module.exports = log
module.exports.types = { SUCCESS, DEBUG, PENDING, ERROR, START, STOP }
