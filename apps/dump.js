require('dotenv').config()
const Database = require('../models')
const moment = require('moment')
const Bucket = require('../libs/gcp-bucket')
const { Cache, Defaults } = require('../libs/stats')
const highland = require('highland')
const { loop, ONE_HOUR_MS, ONE_DAY_MS } = require('../libs/utils')

async function resume(OLD_DB, NEW_DB) {

  let count = 0

  // buffer changes
  const realtimeBuffer = highland()

  // force all events into the buffer
  OLD_DB.events
    .changes()
    .map(row => row.new_val)
    .compact()
    .pipe(realtimeBuffer)

  // resume memory state.
  await OLD_DB.events
    .readStream()
    .filter(row => {
      return row.item.price
    })
    .map(async row => {
      const q = NEW_DB.events.table().insert(row, {
        returnChanges: true,
        conflict: 'replace',
        durability: 'soft',
      })
      const w = await q.run(NEW_DB.events.con)
      count += 1
      console.log(count, row.id)
      return w
    })
    .batch(500)
    .flatMap(highland)
    .errors(err => {
      console.error(err)
      process.exit(1)
    })
    .last()
    .toPromise(Promise)

  // process realtime events
  realtimeBuffer
    .map(async row => {
      const q = NEW_DB.events.table().insert(row, {
        returnChanges: true,
        conflict: 'replace',
        durability: 'soft',
      })
      const w = await q.run(NEW_DB.events.con)
      count += 1
      console.log(count, row.id)
      return w
    })
    .flatMap(highland)
    .errors(err => {
      console.error(err)
      // process.exit(1)
    })
    .each(console.log)
}

module.exports = async config => {
  const OLD_DB = await Database(config.rethink)
  const NEW_DB = await Database(config.rethinknew)

  return resume(OLD_DB, NEW_DB)
}
