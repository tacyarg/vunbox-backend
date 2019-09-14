require('dotenv').config()
const Database = require('../models')
const moment = require('moment')
const Bucket = require('../libs/gcp-bucket')
const { Cache, Defaults } = require('../libs/stats')
const highland = require('highland')
const { loop, ONE_HOUR_MS } = require('../libs/utils')

// create and post daily snapshots of processed data.

module.exports = config => {
  return Database(config.rethink).then(
    async ({ events, stats, users, items, cases, snapshots, backups }) => {
      const statsCache = Cache(Defaults.user)
      const bucket = Bucket(config.gcloud)
      const boxes = {}

      loop(async () => {
        const files = await bucket.listFiles()
        return backups.upsert(
          files.map(file => {
            return {
              contentType: file.contentType,
              id: file.name,
              size: file.size,
              contentEncoding: file.contentEncoding,
              updated: file.updated,
              created: file.timeCreated,
              link: file.mediaLink,
            }
          })
        )
      }, ONE_HOUR_MS)

      function createBucketStream(time) {
        const date = moment(time)
          .subtract(1, 'days')
          .format('MM-D-YYYY')
        const fileName = `stats_${date}.json`
        return bucket.writeStream(fileName)
      }

      function dumpMemory(time, table) {
        console.log('Dumping to Bucket:', time)
        const bucketStream = createBucketStream(time)

        const list = statsCache.list()
        const global = statsCache.get('global')
        statsCache.drop() // clear stats

        snapshots.upsert({
          ...global,
          type: 'snapshot',
          id: time,
        })

        highland(list)
          .collect()
          .map(row => JSON.stringify(row, null, 2))
          .errors(console.error)
          .pipe(bucketStream)
      }

      var day = null

      async function handleEvent(event) {
        if (!day) {
          // check day, if past day, dump to bucket
          day = moment(event.created)
            .add(1, 'days')
            .valueOf()
        }

        if (event.created > day) {
          dumpMemory(day, statsCache)
          day = null
        } else {
          // console.log(day, event.created)
        }

        switch (event.type) {
          case 'case-opened':
            // simple cache to optimize processing speed...
            if (!boxes[event.caseId]) {
              event.box = await cases.get(event.caseId)
              boxes[event.caseId] = event.box
            } else {
              event.box = boxes[event.caseId]
            }

            return [
              statsCache.processCaseEvent(event.caseOpeningSite, event),
              statsCache.processAdditionalCaseStats(
                event.caseOpeningSite,
                event
              ),
              statsCache.processCaseEvent(event.userId, event),
              statsCache.processAdditionalCaseStats(event.userId, event),
              statsCache.processCaseEvent('global', event),
              statsCache.processAdditionalCaseStats('global', event),
            ]
          case 'trade-offers':
            const results = []

            // sometimes sender is null
            if (event.sender) {
              const stats = statsCache.processTradeEvent(
                event.sender.userId,
                event
              )
              results.push(stats)
            }

            if (event.recipient) {
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
        .filter(row => {
          return row.item.price
        })
        .compact()
        .pipe(realtimeBuffer)

      // resume memory state.
      await events
        .streamSorted()
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

      // process realtime events
      realtimeBuffer
        .map(handleEvent)
        .flatMap(highland)
        .errors(err => {
          console.error(err)
          // process.exit(1)
        })
        .each(console.log)

      return {
        ...snapshots,
        listFiles: bucket.listFiles()
      }
    }
  )
}
