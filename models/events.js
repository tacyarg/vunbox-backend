const { Table } = require('rethink-table')

module.exports = async con => {
  const schema = {
    table: 'events',
    indices: ['created', 'updated', 'type'],
  }

  const table = await Table(con, schema)

  return {
    ...table,
    changes() {
      const query = table.table().changes()
      return table.streamify(query)
    },
    streamSorted() {
      const query = table.table().orderBy({index: 'created'})
      return table.streamify(query)
    },
    streamFrom(index, key = 'created') {
      const query = table.table().between(key, r.maxval, {index})
      return table.streamify(query)
    },
    listTopSites() {
      const query = table
        .table()
        .getAll('case-opened', { index: 'type' })
        .group('caseOpeningSite')
        .count()
        .ungroup()
        .orderBy(table.r.desc('reduction'))
        .limit(100)

      return table.run(query)
    },
    listTopUsers() {
      const query = table
        .table()
        .getAll('case-opened', { index: 'type' })
        .group('userId')
        .count()
        .ungroup()
        .orderBy(table.r.desc('reduction'))
        .limit(100)

      return table.run(query)
    },
    listTopCases() {
      const query = table
        .table()
        .getAll('case-opened', { index: 'type' })
        .group('caseName')
        .count()
        .ungroup()
        .orderBy(table.r.desc('reduction'))
        .limit(100)

      return table.run(query)
    },
  }
}
