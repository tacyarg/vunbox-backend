require('dotenv').config()
const Database = require('../models')
const { loop, ONE_MINUTE_MS } = require('../libs/utils')
const ExpressTrade = require('../libs/wet')

// Poll the wax api for the current available cases.

module.exports = async config => {
  const { cases } = await Database(config.rethink)
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

  return {
    updateCases,
    getCase: async id => cases.get(id),
    listCases: async () => cases.list(),
  }
}
