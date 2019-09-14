require('dotenv').config()
const Socket = require('../libs/websocket')
const Database = require('../models')
const highland = require('highland')
const Decrypt = require('../libs/decrypt')

// listen and formalize new events, save them to a table for later consumption.

module.exports = async config => {
  const { events } = await Database(config.rethink)
  const socket = Socket('https://realtimefeed-api.wax.io')

  // save a copy of the event in memeory
  const recentEvents = []

  function updateRecentEvents(event) {
    if (!event) return
    recentEvents.push(event)
    if (recentEvents.length > 100) recentEvents.pop()
    return recentEvents
  }

  const CreateEvent = (type, event) => {
    return {
      type,
      ...event,
      created: Date.now(),
      updated: Date.now(),
    }
  }

  // process stream...
  highland('case-opened', socket)
    .map(event => {
      updateRecentEvents(event)
      return CreateEvent('case-opened', event)
    })
    .filter(row => row.item.price)
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

      updateRecentEvents(event)
      return CreateEvent('trade-offers', event)
    })
    .filter(row => row.item.price)
    .map(events.upsert)
    .flatMap(highland)
    .errors(console.error)
    .doto(console.log)
    .resume()

  return {
    recentEvents() {
      return recentEvents
    },
    openStream(topic) {
      return highland(topic, socket).toPromise(Promise)
    },
  }
}
