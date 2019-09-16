const Database = require('../../models')
const highland = require('highland')
const { Cache, Defaults } = require('../../libs/stats')
const Events = require('./events')

const TableStream = require('../../libs/tableStream')

module.exports = async config => {
  const { events, userstats, users, items, cases } = await Database(
    config.rethink
  )

  const cache = Cache(Defaults.user)
  const handle = Events({
    users,
    items,
    cases,
    statsCache: cache,
  })

  return TableStream({
    events,
    cache,
    handle,
    table: userstats,
  })
}
