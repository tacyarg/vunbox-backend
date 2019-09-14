const { Table } = require('rethink-table')

module.exports = async con => {
  const schema = {
    table: 'casesites',
    indices: [
      'created',
      'updated',
      'type',
      'userid',
      'caseOpenings',
      'caseTotalAwarded',
      'incomingTradesCount',
      'incomingTradesTotal',
      'outgoingTradesCount',
      'outgoingTradesTotal',
      'tradesCount',
      'tradesTotalValue',
      'tradesProfit',
      'caseTotalRake',
      'caseTotalSpent'
    ],
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
    listType(type) {
      return table.getBy('type', type)
    },
    listTop(index) {
      const query = table
        .table()
        .orderBy({ index: table.r.desc(index) })
        .coerceTo('array')
        .limit(100)

      return table.run(query)
    },
    listTopTradeProfit() {
      const query = table
        .table()
        .orderBy({ index: table.r.desc('tradesProfit') })
        .coerceTo('array')
        .limit(100)

      return table.run(query)
    },
    listTopCaseRewarded() {
      const query = table
        .table()
        .orderBy({ index: table.r.desc('caseRewarded') })
        .coerceTo('array')
        .limit(100)

      return table.run(query)
    },
    // listTopItemsRewarded() {
    //   const query = table
    //     .table()
    //     .orderBy(table.r.desc('caseRewarded'))
    //     .limit(100)

    //   return table.run(query)
    // },
    // listTopItemsObtained() {
    //   const query = table
    //     .table()
    //     .orderBy(table.r.desc('caseRewarded'))
    //     .limit(100)

    //   return table.run(query)
    // },
  }
}
