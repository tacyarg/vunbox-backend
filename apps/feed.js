require('dotenv').config()
const Socket = require('../libs/client')
const Database = require('../models')
const highland = require('highland')
const Decrypt = require('../libs/decrypt')

module.exports = config => {
  return Database(config.rethink).then(async ({ events }) => {
    const socket = Socket('https://realtimefeed-api.wax.io')

    // process stream...
    highland('case-opened', socket)
      .map(event => {
        return {
          type: 'case-opened',
          ...event,
          created: Date.now(),
          updated: Date.now(),
        }
      })
      .filter(row => {
        return row.item.price
      })
      .map(events.upsert)
      .flatMap(highland)
      .errors(console.error)
      .doto(console.log)
      .resume()

    // highland('trade-offers', socket)
    highland('815b83b2ac63c33d5', socket)
      .map(event => {
        const value = Decrypt(event)
        event = JSON.parse(value)
        return {
          type: 'trade-offers',
          ...event,
          created: Date.now(),
          updated: Date.now(),
        }
      })
      .filter(row => {
        return row.item.price
      })
      .map(events.upsert)
      .flatMap(highland)
      .errors(console.error)
      .doto(console.log)
      .resume()
  })
}
