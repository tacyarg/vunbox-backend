const Database = require('../models')
const TableStream = require('../libs/tableStream')
const assert = require('assert')

module.exports = async config => {
  const { events, cases, caseopened } = await Database(config.rethink)
  const boxes = {}
  const cache = new Map()
  let eventCount = 0

  const Defaults = (id, o) => {
    return {
      id, // the context on which the data is based.
      type: 'caseopened',
      created: Date.now(),
      updated: Date.now(),
      count: 0, // count of ids
      spent: 0, // total spent to open the case
      awarded: 0, // total unboxed
      profit: 0, // profit made from the case.
      ...o,
    }
  }

  function updateStats(id, { item, box }) {
    assert(id, 'requires id')

    let stats = cache.get(id)
    stats = Defaults(id, stats)

    stats.count += 1
    stats.spent += box.price
    stats.awarded += item.price
    stats.profit = stats.awarded - stats.spent
    stats.boxName = box.name
    stats.boxId = box.id

    cache.set(id, stats)

    return stats
  }

  const handle = async e => {
    console.log('event', ++eventCount, e.id)
    if (e.type !== 'case-opened') return

    if (boxes[e.caseId]) {
      e.box = boxes[e.caseId]
    } else {
      e.box = await cases.get(e.caseId)
      boxes[e.caseId] = e.box
    }

    return [
      updateStats(e.item.name, e),
      updateStats(e.caseOpeningSite, e),
      updateStats(e.item.genesisId, e),
      updateStats(e.userId, e),
      updateStats(e.caseName, e),
    ]
  }

  return TableStream({
    handle,
    events,
    cache,
    table: caseopened,
  })
}
