const Database = require('../models')
const highland = require('highland')
const Leaderboards = require('../libs/leaderboards').Cache

// for all new userstats changes, create leaderboards.

module.exports = async config => {
  const { caseopened, leaderboards } = await Database(config.rethink)
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
      // leaderboardCache.processLeaderboard(`bestItemUnboxed`, stats, row => {
      //   return row.bestItemUnboxed.price
      // }),
      // leaderboardCache.processLeaderboard(`bestItemTraded`, stats, row => {
      //   return row.bestItemTraded.price
      // }),
      // leaderboardCache.processLeaderboard(`caseOpenings`, stats),
      // leaderboardCache.processLeaderboard(`caseTotalAwarded`, stats),
      // leaderboardCache.processLeaderboard(`incomingTradesCount`, stats),
      // leaderboardCache.processLeaderboard(`incomingTradesTotal`, stats),
      // leaderboardCache.processLeaderboard(`outgoingTradesCount`, stats),
      // leaderboardCache.processLeaderboard(`outgoingTradesTotal`, stats),
      // leaderboardCache.processLeaderboard(`tradesCount`, stats),
      // leaderboardCache.processLeaderboard(`tradesTotalValue`, stats),
      // leaderboardCache.processLeaderboard(`tradesProfit`, stats),
      leaderboardCache.processLeaderboard(stats.id, stats, r => {
        return r.profit
      }),
    ]
  }

  // process all existings stats.
  await caseopened
    .readStream()
    .map(stats => {
      console.log('processLeaderboards:', ++totalEvents, stats.id)
      return processLeaderboards(stats)
    })
    .map(leaderboards.upsert)
    .flatMap(highland)
    .errors(err => {
      console.error('Error Resuming cache:', err)
      process.exit(1)
    })
    .last()
    .toPromise(Promise)
  
  // watch for changes in realtime.
  caseopened
    .changes()
    .map(r => r.new_val)
    .compact()
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
    .resume()

  return {
    ...leaderboardCache,
  }
}
