const { Init } = require('rethink-table')

module.exports = config => {
  return Init.advanced(config, [
    require('./events'),
    require('./userstats'),
    require('./casestats'),
    require('./casesites'),
    require('./users'),
    require('./leaderboards'),
    require('./items'),
    require('./cases'),
    require('./snapshots'),
    require('./backups'),
    require('./tradeoffers'),
    require('./caseopened')
  ])
}
