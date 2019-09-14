require('dotenv').config()
const Database = require('../models')
const Actions = require('../libs/actions')

// Expose the processed data over http

module.exports = async config => {
  return Database(config.rethink)
    .then(Actions)
}
