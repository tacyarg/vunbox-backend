const lodash = require('lodash')
const assert = require('assert')

module.exports = stats => {
  return {
    increment(prop, value = 1) {
      assert(prop, 'prop required')
      assert(lodash.isFinite(value), 'value must be a mumber')
      assert(value > 0, 'value must be greater than 0')
      stats[prop] = stats[prop] ? stats[prop] : 0 
      stats[prop] += value
      return stats
    },
    decrement(prop, value = 1) {
      assert(prop, 'prop required')
      assert(lodash.isFinite(value), 'value must be a mumber')
      assert(value > 0, 'value must be greater than 0')
      stats[prop] = stats[prop] ? stats[prop] : 0 
      stats[prop] -= value
      return stats
    },
    setProp(prop, value) {
      assert(prop, 'prop required')
      assert(lodash.isFinite(value), 'value must be a mumber')

      stats[prop] = value
      return stats
    },
    setBestItem(prop, item) {
      assert(prop, 'prop required')
      assert(lodash.isObject(item), 'value must be a mumber')

      stats[prop] = item
      return stats
    }
  }
}
