const assert = require('assert')
const uuid = require('uuid/v4')

module.exports = ({ maxTTL = 1 }) => {
  const state = {}

  function defaults(props) {
    return {
      id: uuid(),
      created: Date.now(),
      updated: Date.now(),
      ...props,
    }
  }

  return {
    set(id, data) {
      assert(id, 'requires type')
      assert(data, 'requires data')
      state[id] = defaults({
        id,
        data,
      })
      return data
    },
    get(id) {
      assert(state[id], 'id not found')
      const row = state[id]
      assert(row.created + maxTTL > Date.now(), 'cache expired')
      return row.data
    },
    getStale(id) {
      assert(state[id], 'id not found')
      const row = state[id]
      return row.data
    },
    isExpired(id) {
      assert(state[id], 'id not found')
      const row = state[id]
      return row.created + maxTTL < Date.now()
    },
  }
}
