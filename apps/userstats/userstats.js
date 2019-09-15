const Database = require('../../models')
const highland = require('highland')
const { Cache, Defaults } = require('../../libs/stats')
const Events = require('./events')

// process events creating stats by userid.

module.exports = async config => {
  const { events, userstats, users, items, cases } = await Database(
    config.rethink
  )

  const statsCache = Cache(Defaults.user)
  const handle = Events({
    users,
    items,
    cases,
    statsCache,
  })

  // buffer changes
  const realtimeBuffer = highland()

  // cache all realtime events while we resume.
  events
    .changes()
    .map(row => row.new_val)
    .compact()
    .pipe(realtimeBuffer)

  console.log('Streaming the old stats from the database.')
  // pause, resume service from memory
  const last = await userstats
    .streamSorted()
    .map(statsCache.set)
    .errors(err => {
      console.error('Error Resuming cache:', err)
      process.exit(1)
    })
    .last()
    .toPromise(Promise)

  console.log('Start streaming all events from:', last.updated)
  // process all events from last mutation to now.
  await events
    .streamFrom(last.updated)
    .filter(row => row.item.price)
    .map(handle)
    .flatMap(highland)
    .errors(err => {
      console.error(err)
      process.exit(1)
    })
    .toPromise(Promise)

  console.log('Dump everything we got so far...')
  // dump cache to db
  statsCache
    .highland()
    .map(userstats.upsert)
    .flatMap(highland)
    .errors(err => {
      console.error(err)
      process.exit(1)
    })
    .each(r => console.log(r.id))

  console.log('Stream realtime!')
  // process realtime events forever.
  realtimeBuffer
    .map(handle)
    .flatMap(highland)
    .map(userstats.upsert)
    .flatMap(highland)
    .errors(console.error)
    .resume()

  return {
    async openStream() {
      return realtimeBuffer.toPromise(Promise)
    },
    async list() {
      return statsCache.list()
    },
  }
}
