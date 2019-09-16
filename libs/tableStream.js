const highland = require('highland')

module.exports = async ({ handle, events, table, cache }) => {
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
  const last = await table
    .streamSorted()
    .doto(r => cache.set(r.id, r))
    .errors(err => {
      console.error('Error Resuming cache:', err)
      process.exit(1)
    })
    .last()
    .toPromise(Promise)

  console.log('Start streaming events')
  // process all events from last mutation to now.
  await events
    .streamFrom(last ? last.updated : 0)
    // .filter(row => row.item.price)
    .map(handle)
    .flatMap(highland)
    .errors(err => {
      console.error(err)
      process.exit(1)
    })
    .last()
    .toPromise(Promise)

  // dump cache to db
  highland([...cache.values()])
    .batch(10)
    .map(table.upsert)
    .flatMap(highland)
    .errors(err => {
      console.error(err)
      process.exit(1)
    })
    .done(r => console.log("Done saving the cache!"))

  console.log('Stream realtime!')
  // process realtime events forever.
  realtimeBuffer
    .map(handle)
    .flatMap(highland)
    .map(table.upsert)
    .flatMap(highland)
    .errors(console.error)
    .resume()

  return {
    async openStream() {
      return realtimeBuffer.toPromise(Promise)
    },
    ...table,
    last,
    // cache
  }
}
