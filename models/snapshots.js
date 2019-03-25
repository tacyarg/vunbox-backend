const { Table } = require('rethink-table')

module.exports = async con => {
  const schema = {
    table: 'snapshots',
    indices: ['created'],
  }

  const table = await Table(con, schema)

  return {
    ...table,
    changes() {
      const query = table.table().changes()
      return table.streamify(query)
    },
    listRecent(limit = 30, index = 'id') {
      const query = table
        .table()
        .orderBy({ index: table.r.desc(index) })
        .coerceTo('array')
        .limit(limit)

      return table.run(query)
    },
  }
}
