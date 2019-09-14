const Database = require('../models')
const highland = require('highland')
const { Cache, Defaults } = require('../libs/stats')

module.exports = config => {
  return Database(config.rethink).then(
    async ({ events, stats, users, leaderboards, items, cases }) => {
      const caseStats = Cache(Defaults.caseSite)

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

        return [
          caseStats.processCaseEvent(event.caseOpeningSite, event),
          caseStats.processCaseSiteStats(event.caseOpeningSite, event),
          caseStats.processAdditionalCaseSiteStats(
            event.caseOpeningSite,
            event
          ),
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
        .readStream()
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
      await caseStats
        .highland()
        .map(stats.upsert)
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
        .map(stats.upsert)
        .flatMap(highland)
        .errors(err => {
          console.error(err)
          // process.exit(1)
        })
        .each(console.log)

      return {
        openStream() {
          return realtimeBuffer.toPromise(Promise)
        },
        ...caseStats,
      }
    }
  )
}
