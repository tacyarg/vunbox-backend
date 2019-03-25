const { Table } = require('rethink-table')
const assert = require('assert')

module.exports = async con => {
  const schema = {
    table: 'users',
    indices: ['username'],
  }

  const table = await Table(con, schema)

  function defaults(props) {
    return {
      created: Date.now(),
      updated: Date.now(),
      history: [],
      ...props,
    }
  }

  return {
    ...table,
    async save(userid, data = {}) {
      assert(userid, 'userid required')

      // console.log(userid, data)

      let user = null
      try {
        user = await table.get(userid)
        if (user.username !== data.username) {
          const existing = user.history.find(name => {
            return name === data.username
          })
          if (!existing) {
            user.history.push(data.username)
            if (user.history > 10) user.history.shift()
          }

          if (user.username === 'Anonymous' && data.username !== 'Anonymous') {
            user.username = data.username
          }
        }
      } catch (e) {
        user = defaults({
          id: userid,
          ...data,
        })
      }

      return table.upsert({
        ...user,
        updated: Date.now(),
      })
    },
  }
}
