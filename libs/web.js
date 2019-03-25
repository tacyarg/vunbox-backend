const uWS = require('uWebSockets.js')
const assert = require('assert')
const lodash = require('lodash')

const Cache = require('../libs/cache')
const { ONE_HOUR_MS, ONE_MINUTE_MS, ONE_DAY_MAS } = require('../libs/utils')

module.exports = ({ port }, actions) => {
  const app = uWS.App({
    // key_file_name: 'misc/key.pem',
    // cert_file_name: 'misc/cert.pem',
    // passphrase: '1234',
  })

  // hack to cache responses
  const cache = Cache({
    maxTTL: 5000,
  })

  const tryAction = async action => {
    let result = null
    try {
      // check cache
      result = cache.get(action)
      console.log('FROM CACHE', action)
    } catch (e) {
      // call service
      result = await actions[action]().then(JSON.stringify)
      cache.set(action, result)
      console.log('FROM SERVICE', action)
    }
    return result
  }

  const checkExpired = async action => {
    const isExpired = cache.isExpired(action)
    if (isExpired) {
      console.log('cache expired:', action)
      actions[action]()
        .then(JSON.stringify)
        .then(result => {
          cache.set(action, result)
          console.log('Updated Cache:', action)
        })
    }
  }

  // hack to debounce responses
  const checkExpiredDebounced = lodash.debounce(checkExpired, 1000, {
    maxWait: 5000,
  })

  app.get('/:action', async (res, req) => {
    res.onAborted(() => {
      res.aborted = true
    })

    const action = req.getParameter(0)
    if (!actions[action]) return res.end(`Invalid Action: ${action}`)

    let result = null
    try {
      // get cache
      result = cache.getStale(action)
      console.log('FROM CACHE', action)

      // update the cache async
      checkExpired(action)
    } catch (e) {
      // call service
      result = await tryAction(action)
    }

    if (!res.aborted) {
      res.writeHeader('Access-Control-Allow-Origin', '*')
      res.writeHeader('Content-Type', 'application/json')
      res.end(result)
    }
  })

  app.get('/*', (res, req) => {
    /* Wildcards - make sure to catch them last */
    res.writeHeader('Access-Control-Allow-Origin', '*')
    res.writeHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(Object.keys(actions)))
  })

  app.listen(port, token => {
    if (token) {
      console.log('Listening to port ' + port)
    } else {
      console.log('Failed to listen to port ' + port)
    }
  })
}
