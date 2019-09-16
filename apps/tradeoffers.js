const Database = require('../models')
const TableStream = require('../libs/tableStream')

module.exports = async config => {
  const { events, tradeoffers } = await Database(config.rethink)

  const Defaults = (id, o) => {
    return {
      id,
      type: 'tradeoffers',
      created: Date.now(),
      updated: Date.now(),
      count: 0,
      totalValue: 0,
      price: 0,
      ...o,
    }
  }

  const cache = new Map()
  
  const handle = async ({ item }) => {
    let stats = cache.get(item.name)
    stats = Defaults(item.name, stats)

    stats.count += 1
    stats.totalValue += item.price
    stats.price = item.price

    cache.set(item.name, stats)

    return stats
  }

  return TableStream({
    handle,
    events,
    cache,
    table: tradeoffers,
  })
}
