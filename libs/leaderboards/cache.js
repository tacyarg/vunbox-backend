const Memtable = require('memtable')
const lodash = require('lodash')
const assert = require('assert')
const defaults = require('./defaults')

module.exports = config => {
  const table = Memtable({
    indexes: [
      // { name: 'userid', required: false, index: 'userid', unique: false },
    ],
  })

  function create(props = {}) {
    assert(!has(props.id), 'This id is already exists')
    const result = defaults(props)
    return table.set(result)
  }

  function set(props) {
    props = defaults(props)
    return table.set(props)
  }
  function get(id) {
    const result = table.get(id)
    assert(result, 'That id does not exist, try creating it first')
    return result
  }
  function has(id) {
    return table.has(id)
  }
  function update(id, props) {
    const result = get(id)
    return set({ updated: Date.now(), ...result, ...props })
  }

  function getOrCreate(id, data = {}) {
    let leaderboard = null
    try {
      leaderboard = get(id)
    } catch (e) {
      data.id = id
      leaderboard = create(data)
    }
    return leaderboard
  }

  function list() {
    return [...table.values()]
  }

  return {
    create,
    set,
    get,
    has,
    update,
    getOrCreate,
    list,
    processLeaderboard(name, event, orderParams) {
      // assert(orderParams, 'orderParams required to sort leaderboard')
      let { data, limit } = getOrCreate(name)
      // push new value
      // sort array
      // slice with limit
      if (event[name]) {
        data.push(event)
        data = lodash.orderBy(data, orderParams || name, ['desc'])
        data = lodash.slice(data, 0, limit)
        return update(name, { data })
      }

      return getOrCreate(name)
    },
  }
}
