const Database = require('../models')
const highland = require('highland')
const Leaderboards = require('../libs/leaderboards').Cache

module.exports = config => {
  return Database(config.rethink).then(
    async ({ events, stats, users, leaderboards }) => {
      const leaderboardCache = Leaderboards()

      await leaderboards
        .readStream()
        .map(leaderboardCache.set)
        .batch(100)
        .last()
        .toPromise(Promise)

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

      // watch for changes
      stats
        .changes()
        .map(({ new_val }) => new_val)
        .compact()
        .filter(stats => {
          return stats.id !== 'global'
        })
        .map(processLeaderboards)
        .map(leaderboards.upsert)
        .flatMap(highland)
        .errors(err => {
          console.error(err)
          process.exit(1)
        })
        .resume()
    }
  )
}
