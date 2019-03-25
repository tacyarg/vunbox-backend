const uuid = require('uuid/v4')
const assert = require('assert')

module.exports = props => {
  return {
    // type: config.type,
    id: uuid(),
    updated: Date.now(),
    created: Date.now(),
    limit: 100,
    data: [],
    ...props,
  }
}
