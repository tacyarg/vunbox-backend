require('dotenv').config()
const Database = require('../models')
const Actions = require('../libs/actions')

module.exports = async config => {
  return Database(config.rethink)
    .then(Actions)
}
