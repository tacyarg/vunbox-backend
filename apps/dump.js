require('dotenv').config()
const Database = require('../models')
const moment = require('moment')
const Bucket = require('../libs/gcp-bucket')
const { Cache, Defaults } = require('../libs/stats')
const highland = require('highland')
const { loop, ONE_HOUR_MS, ONE_DAY_MS } = require('../libs/utils')

module.exports = config => {
  const dynamodb = require('../libs/dynamodb')(config.dynamodb)('vunbox.events')

  return Database(config.rethink).then(
    async ({ events, stats, users, items, cases, snapshots, backups }) => {

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
          console.log(row.id)
          return row.item.price
        })
        .map(dynamodb.insert)
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
        .map(dynamodb.insert)
        .flatMap(highland)
        .errors(err => {
          console.error(err)
          // process.exit(1)
        })
        .each(console.log)
    }
  )
}
