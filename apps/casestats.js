const Database = require('../models')
const highland = require('highland')
const { Cache, Defaults } = require('../libs/stats')

// process all stats for each case.

module.exports = async config => {
  const { events, casestats, items, cases } = await Database(config.rethink)
  const statsCache = Cache(Defaults.case)

  const boxes = {}
  let totalEvents = 0

  async function handleEvent(event) {
    console.log('handleEvent:', ++totalEvents, event.id)

    // simple cache to optimize processing speed...
    if (!boxes[event.caseId]) {
      event.box = await cases.get(event.caseId)
      boxes[event.caseId] = event.box
    } else {
      event.box = boxes[event.caseId]
    }

    items.upsert({
      id: event.item.name,
      name: event.item.name,
      price: event.item.price,
      rarity: event.item.rarity,
      image: event.item.image,
    })
    return [
      statsCache.processCaseEvent(event.caseId, event),
      statsCache.processAdditionalCaseStats(event.caseId, event),
    ]
  }

  // buffer changes
  const realtimeBuffer = highland()

  // force all events into the buffer
  events
    .changes()
    .map(row => row.new_val)
    .compact()
    .filter(row => row.type === 'case-opened')
    .filter(row => row.item.price)
    .pipe(realtimeBuffer)

  // resume memory state.
  await events
    .streamSorted()
    .filter(row => row.type === 'case-opened')
    .filter(row => row.item.price)
    .map(handleEvent)
    .batch(500)
    .flatMap(highland)
    .errors(err => {
      console.error(err)
      process.exit(1)
    })
    .last()
    .toPromise(Promise)

  // dump to db
  await statsCache
    .highland()
    .map(casestats.upsert)
    .flatMap(highland)
    .errors(err => {
      console.error(err)
      process.exit(1)
    })
    .last()
    .toPromise(Promise)

  // process realtime events
  realtimeBuffer
    .map(handleEvent)
    .flatMap(highland)
    .map(casestats.upsert)
    .flatMap(highland)
    .errors(err => {
      console.error(err)
      // process.exit(1)
    })
    .resume()

  return {
    openStream() {
      return realtimeBuffer.toPromise(Promise)
    },
    ...statsCache,
  }
}
