require('dotenv').config()
const Database = require('../models')
const moment = require('moment')
const Bucket = require('../libs/gcp-bucket')
const { Cache, Defaults } = require('../libs/stats')
const highland = require('highland')
const { loop, ONE_HOUR_MS, ONE_DAY_MS } = require('../libs/utils')

module.exports = config => {
  return Database(config.rethink).then(
    async ({ events, stats, users, items, cases, snapshots, backups }) => {

      async function dump() {

        const startTime = Date.now()

        const bucketStream = Bucket(config.gcloud).writeStream(
          `db_dump_events_${startTime}`
        )

        await events
          .streamSorted()
          .filter(row => {
            return row.item.price
          })
          .map(event => {
            return bucketStream.write(JSON.stringify(event))
          })
          .errors(err => {
            console.error(err)
            process.exit(1)
          })
          .last()
          .toPromise(Promise)

        bucketStream.end()

        const duration = Date.now()-startTime
        console.log(`Completed in ${duration/1000}s.`)
      }

      // start backup loop
      loop(dump, ONE_DAY_MS)
    }
  )
}
