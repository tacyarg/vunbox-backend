const { Table } = require('rethink-table')

module.exports = async con => {
  const schema = {
    table: 'items',
    indices: ['rarity', 'name'],
  }

  const table = await Table(con, schema)

  return {
    ...table,
    changes() {
      const query = table.table().changes()
      return table.streamify(query)
    },
  }
}
