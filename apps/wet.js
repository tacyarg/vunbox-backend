require('dotenv').config()
const Database = require('../models')
const { loop, ONE_MINUTE_MS } = require('../libs/utils')
const ExpressTrade = require('../libs/wet')

module.exports = async config => {
  return Database(config.rethink).then(({ cases }) => {
    const api = ExpressTrade({
      //NOTE: not required to fetch case list...
      // key: '', 
    })

    async function updateCases() {
      const list = await api.listCases()
      console.log(`Found ${list.length} items.`)
      return cases.upsert(list)
    }

    // get cases
    loop(updateCases, 5 * ONE_MINUTE_MS)
  })
}
