require('dotenv').config()
const assert = require('assert')
const { parseEnv } = require('../utils')
const config = parseEnv(process.env)
const highland = require('highland')

const db = require('./dynamodb')(config.dynamodb)('vunbox.events')

db.insert({
  username: 'test',
  password: 'test',
})
  .then(db.get)
  .then(console.log)
  .catch(console.error)
