require('dotenv').config()
const Database = require('../models')
const Actions = require('../libs/actions')
const Web = require('../libs/web')

module.exports = async config => {
  return Database(config.rethink)
    .then(Actions)
    .then(actions => {
      return Web(config, actions)
    })
}
