const Database = require('../models')
const highland = require('highland')
const { Cache, Defaults } = require('../libs/stats')

module.exports = config => {
  return Database(config.rethink).then(
    async ({ events, stats, users, items, cases }) => {
      const statsCache = Cache(Defaults.user)
      const boxes = {}

      async function handleEvent(event) {
        switch (event.type) {
          case 'case-opened':
          // simple cache to optimize processing speed...
          if (!boxes[event.caseId]) {
            event.box = await cases.get(event.caseId)
            boxes[event.caseId] = event.box
          } else {
            event.box = boxes[event.caseId]
          }

            users.save(event.userId, {
              username: event.userName,
              avatar: event.userAvatar,
            })
            items.upsert({
              id: event.item.name,
              name: event.item.name,
              price: event.item.price,
              rarity: event.item.rarity,
              image: event.item.image,
            })
            return [
              statsCache.processCaseEvent(event.userId, event),
              statsCache.processAdditionalCaseStats(event.userId, event),
              statsCache.processCaseEvent('global', event),
              statsCache.processAdditionalCaseStats('global', event),
            ]
          case 'trade-offers':
            const results = []

            // sometimes sender is null
            if (event.sender) {
              users.save(event.recipient.userId, {
                username: event.recipient.userName,
              })
              const stats = statsCache.processTradeEvent(
                event.sender.userId,
                event
              )
              results.push(stats)
            }

            if (event.recipient) {
              users.save(event.sender.userId, {
                username: event.sender.userName,
              })
              const stats = statsCache.processTradeEvent(
                event.recipient.userId,
                event
              )
              results.push(stats)
            }

            return [...results, statsCache.processTradeEvent('global', event)]
        }
      }

      // buffer changes
      const realtimeBuffer = highland()

      // force all events into the buffer
      events
        .changes()
        .map(row => row.new_val)
        .compact()
        .pipe(realtimeBuffer)

      // resume memory state.
      await events
        .readStream()
        .filter(row => {
          return row.item.price
        })
        .map(handleEvent)
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
    }
  )
}
