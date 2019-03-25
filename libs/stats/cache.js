const Memtable = require('memtable')
const assert = require('assert')
const Methods = require('./methods')
const lodash = require('lodash')
// const defaults = require('./defaults')

module.exports = Defaults => {
  var table = Memtable({
    indexes: [
      { name: 'userid', required: false, index: 'userid', unique: false },
      { name: 'type', required: false, index: 'type', unique: false },
    ],
  })

  function create(props = {}) {
    assert(!has(props.id), 'This id is already exists')
    const result = Defaults(props)
    return table.set(result)
  }

  function set(props) {
    props.updated = Date.now()
    return table.set(props)
  }

  function get(id) {
    const result = table.get(id)
    assert(result, 'That id does not exist, try creating it first')
    return result
  }

  function has(id) {
    return table.has(id)
  }

  function getOrCreate(id, data = {}) {
    let stats = null
    try {
      stats = get(id)
    } catch (e) {
      stats = create({ id, ...data })
    }
    return stats
  }

  function list() {
    return [...table.values()]
  }

  return {
    drop: () => {
      table = Memtable({
        indexes: [
          { name: 'userid', required: false, index: 'userid', unique: false },
          { name: 'type', required: false, index: 'type', unique: false },
        ],
      })
    },
    highland: table.highland,
    get,
    has,
    set,
    create,
    list,
    processCaseEvent(id, event) {
      const stats = getOrCreate(id)
      const methods = Methods(stats)
      methods.increment('caseOpenings')

      const item = lodash.cloneDeep(event.item)
      item.price = event.item.price / 100

      methods.increment('caseTotalAwarded', item.price)

      if (!stats.bestItemUnboxed) {
        methods.setBestItem('bestItemUnboxed', item)
      } else if (item.price > stats.bestItemUnboxed.price) {
        methods.setBestItem('bestItemUnboxed', item)
      }

      if (!stats.worstItemUnboxed) {
        methods.setBestItem('worstItemUnboxed', item)
      } else if (item.price < stats.worstItemUnboxed.price) {
        methods.setBestItem('worstItemUnboxed', item)
      }

      if (stats.type === 'case') {
        // stats.itemsUnboxed = stats.itemsUnboxed ? stats.itemsUnboxed : {}
        // stats.itemsUnboxed[event.item.name] = stats.itemsUnboxed[event.item.name]
        //   ? stats.itemsUnboxed[event.item.name] + 1
        //   : 1
        // stats.caseName = event.caseName
      }

      return set(stats)
    },
    processAdditionalCaseStats(id, event) {
      assert(event.box, 'requires event case details')
      const stats = getOrCreate(id)
      const methods = Methods(stats)

      const item = lodash.cloneDeep(event.item)
      item.price = event.item.price / 100

      methods.increment('caseTotalSpent', event.box.price)
      methods.increment('caseTotalRake', event.box.keyPrice * 0.25)
      methods.setProp(
        'caseTotalProfit',
        stats.caseTotalAwarded - stats.caseTotalSpent
      )

      stats.sitesUnboxed = stats.sitesUnboxed ? stats.sitesUnboxed : {}
      stats.sitesUnboxed[event.caseOpeningSite] = stats.sitesUnboxed[
        event.caseOpeningSite
      ]
        ? stats.sitesUnboxed[event.caseOpeningSite]
        : {
            caseTotalSpent: 0,
            caseTotalOpened: 0,
            caseTotalAwarded: 0,
            caseTotalProfit: 0,
            caseTotalRake: 0,
          }

      const siteStats = stats.sitesUnboxed[event.caseOpeningSite]
      siteStats.caseTotalSpent += event.box.price
      siteStats.caseTotalAwarded += item.price
      siteStats.caseTotalOpened += 1
      siteStats.caseTotalRake += event.box.keyPrice * 0.25
      siteStats.caseTotalProfit =
        siteStats.caseTotalAwarded - siteStats.caseTotalSpent

      return set(stats)
    },
    processCaseSiteStats(id, event) {
      assert(event.box, 'requires event case details')
      const stats = getOrCreate(id)
      const methods = Methods(stats)

      const item = lodash.cloneDeep(event.item)
      item.price = event.item.price / 100

      methods.increment('caseTotalOpened')
      methods.increment('caseTotalSpent', event.box.price)
      methods.increment('caseTotalAwarded', item.price)
      methods.increment('caseTotalRake', event.box.keyPrice * 0.25)
      methods.setProp(
        'caseTotalProfit',
        stats.caseTotalAwarded - stats.caseTotalSpent
      )

      return set(stats)
    },
    processAdditionalCaseSiteStats(id, event) {
      assert(event.box, 'requires event case details')
      const stats = getOrCreate(id)
      const methods = Methods(stats)

      const item = lodash.cloneDeep(event.item)
      item.price = event.item.price / 100

      stats.casesUnboxed = stats.casesUnboxed ? stats.casesUnboxed : {}
      stats.casesUnboxed[event.box.name] = stats.casesUnboxed[event.box.name]
        ? stats.casesUnboxed[event.box.name]
        : {
            caseTotalSpent: 0,
            caseTotalOpened: 0,
            caseTotalAwarded: 0,
            caseTotalProfit: 0,
            caseTotalRake: 0,
          }

      const caseStats = stats.casesUnboxed[event.box.name]
      caseStats.caseTotalSpent += event.box.price
      caseStats.caseTotalAwarded += item.price
      caseStats.caseTotalOpened += 1
      caseStats.caseTotalRake += event.box.keyPrice * 0.25
      caseStats.caseTotalProfit =
        caseStats.caseTotalAwarded - caseStats.caseTotalSpent

      return set(stats)
    },
    processCaseItem(id, event) {
      const stats = getOrCreate(id)
      const methods = Methods(stats)

      const item = lodash.cloneDeep(event.item)
      item.price = item.price / 100

      stats.rarity = item.rarity
      stats.price = item.price
      stats.image = item.image

      methods.increment('caseOpenings')
      methods.increment('caseTotalAwarded', item.price)

      return set(stats)
    },
    processTradeEvent(id, event) {
      const stats = getOrCreate(id)
      const methods = Methods(stats)
      const item = lodash.cloneDeep(event.item)
      item.price = item.price / 100

      methods.increment('tradesCount')
      if (item.price > 0) methods.increment('tradesTotalValue', item.price)

      if (id !== 'global') {
        if (id == event.sender.userId) {
          methods.increment('outgoingTradesCount')
          if (item.price > 0)
            methods.increment('outgoingTradesTotal', item.price)
        } else {
          methods.increment('incomingTradesCount')
          if (item.price > 0)
            methods.increment('incomingTradesTotal', item.price)
        }

        methods.setProp(
          'tradesProfit',
          stats.incomingTradesTotal - stats.outgoingTradesTotal
        )
      }

      if (!stats.bestItemTraded) {
        methods.setBestItem('bestItemTraded', item)
      } else if (item.price > stats.bestItemTraded.price) {
        methods.setBestItem('bestItemTraded', item)
      }

      if (!stats.worstItemTraded) {
        methods.setBestItem('worstItemTraded', item)
      } else if (item.price < stats.worstItemTraded.price) {
        methods.setBestItem('worstItemTraded', item)
      }

      return set(stats)
    },
    processTradeItem(id, event) {
      const stats = getOrCreate(id)
      const methods = Methods(stats)

      const item = lodash.cloneDeep(event.item)
      item.price = event.item.price / 100

      stats.rarity = item.rarity
      stats.price = item.price
      stats.image = item.image

      methods.increment('tradesCount')
      methods.increment('tradesTotalValue', item.price)

      methods.increment(event.caseId)

      return set(stats)
    },
  }
}
