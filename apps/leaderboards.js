const Database = require('../models')
const highland = require('highland')
const Leaderboards = require('../libs/leaderboards').Cache

module.exports = async config => {
  const { stats, leaderboards } = await Database(config.rethink)
  const leaderboardCache = Leaderboards()
  let totalEvents = 0

  // load all the pre generated loaderboards from the database.
  await leaderboards
    .readStream()
    .map(leaderboardCache.set)
    .errors(err => {
      console.error('Error Resuming cache:', err)
      process.exit(1)
    })
    .last()
    .toPromise(Promise)

  // consume the event.
  function processLeaderboards(stats) {
    return [
      leaderboardCache.processLeaderboard(`bestItemUnboxed`, stats, row => {
        return row.bestItemUnboxed.price
      }),
      leaderboardCache.processLeaderboard(`bestItemTraded`, stats, row => {
        return row.bestItemTraded.price
      }),
      leaderboardCache.processLeaderboard(`caseOpenings`, stats),
      leaderboardCache.processLeaderboard(`caseTotalAwarded`, stats),
      leaderboardCache.processLeaderboard(`incomingTradesCount`, stats),
      leaderboardCache.processLeaderboard(`incomingTradesTotal`, stats),
      leaderboardCache.processLeaderboard(`outgoingTradesCount`, stats),
      leaderboardCache.processLeaderboard(`outgoingTradesTotal`, stats),
      leaderboardCache.processLeaderboard(`tradesCount`, stats),
      leaderboardCache.processLeaderboard(`tradesTotalValue`, stats),
      leaderboardCache.processLeaderboard(`tradesProfit`, stats),
    ]
  }

  // // process all existings stats.
  // await stats
  //   .readStream()
  //   .filter(r => r.id !== 'global')
  //   .map(stats => {
  //     console.log('processLeaderboards:', ++totalEvents, stats.id)
  //     return processLeaderboards(stats)
  //   })
  //   .map(leaderboards.upsert)
  //   .flatMap(highland)
  //   .errors(err => {
  //     console.error('Error Resuming cache:', err)
  //     process.exit(1)
  //   })
  //   .last()
  //   .toPromise(Promise)
  
  // watch for changes in realtime.
  stats
    .changes()
    .map(r => r.new_val)
    .compact()
    .filter(r => r.id !== 'global')
    .map(stats => {
      console.log('processLeaderboards:', ++totalEvents, stats.id)
      return processLeaderboards(stats)
    })
    .map(leaderboards.upsert)
    .flatMap(highland)
    .errors(err => {
      console.error('Error Consuming Stats:', err)
      process.exit(1)
    })
    .each(console.log)

  return {
    ...leaderboardCache,
  }
}
