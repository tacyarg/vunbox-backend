const highland = require('highland')
const lodash = require('lodash')

module.exports = ({
  stats,
  events,
  users,
  leaderboards,
  cases,
  snapshots,
  backups,
}) => {
  //TODO: move into the model
  const listTopStats = async (type, index) => {
    const query = stats
      .table()
      .orderBy({ index: stats.r.desc(index) })
      .filter({ type })
      .coerceTo('array')
      .limit(100)

    switch (type) {
      case 'user':
        const userStats = await stats.run(query)
        return mergeUsers(userStats)
      case 'case':
        const caseStats = await stats.run(query)
        return mergeCases(caseStats)
      default:
        return stats.run(query)
    }
  }

  const mergeUsers = stream => {
    return highland(stream)
      .flatten()
      .compact()
      .map(async row => {
        try {
          const { username } = await users.get(row.id)
          row.username = username
        } catch (e) {
          console.log('USER NOT FOUND')
          row.username = 'GLOBAL'
        }
        return row
      })
      .map(highland)
      .parallel(25)
      .collect()
      .toPromise(Promise)
  }

  const mergeCases = stream => {
    return highland(stream)
      .flatten()
      .compact()
      .map(async row => {
        return cases
          .get(row.id)
          .then(box => {
            return { ...box, ...row }
          })
          .catch(err => {
            return row
          })
      })
      .map(highland)
      .parallel(25)
      .filter(row => row.keyPrice)
      .collect()
      .toPromise(Promise)
  }

  //TODO: do in the cache layer
  const mapCaseData = list => {
    return list.map(box => {
      const price = box.keyPrice * 2.5
      const spent = box.caseOpenings * price
      const profit = box.caseTotalAwarded - spent
      const averageProfit = box.caseTotalAwarded / box.caseOpenings
      // const roi = averageProfit - price
      const roi = box.caseTotalAwarded / spent
      const expectedValue = roi * price
      return {
        ...box,
        price,
        spent,
        profit,
        averageProfit: averageProfit,
        roi: roi * 100,
        expectedValue,
        chance: (averageProfit / spent) * 100,
      }
    })
  }

  function filterProps(list, props) {
    return list.map(row => {
      return lodash.pick(row, props)
    })
  }

  return {
    listUserStats() {
      return stats.listType('user')
    },
    listCaseSiteStats() {
      return stats.listType('casesite')
    },
    listCaseStats() {
      return stats.listType('case')
    },
    async listSiteMostOpenings() {
      let list = await listTopStats('casesite', 'caseOpenings')
      return filterProps(list, ['id', 'caseOpenings'])
    },
    async listSiteMostRake() {
      let list = await listTopStats('casesite', 'caseTotalRake')
      return filterProps(list, ['id', 'caseTotalSpent', 'caseTotalRake'])
    },
    async getGlobalStats() {
      const {
        bestItemUnboxed,
        caseOpenings,
        caseTotalAwarded,
        id,
      } = await stats.get('global')
      return {
        bestItemUnboxed,
        caseOpenings,
        caseTotalAwarded,
        id,
      }
    },
    // CASE STATS
    async listCaseMostOpenings() {
      let list = await listTopStats('case', 'caseOpenings')
      return filterProps(list, ['name', 'caseOpenings'])
    },
    async listCaseMostSpent() {
      let list = await listTopStats('case', 'caseTotalSpent')
      return filterProps(list, ['name', 'caseTotalSpent'])
    },
    async listCaseMostAwarded() {
      let list = await listTopStats('case', 'caseTotalAwarded')
      return filterProps(list, ['name', 'caseTotalAwarded'])
    },
    async listCaseMostProfitable() {
      let list = await stats
        .getBy('type', 'case')
        .then(mergeCases)
        .then(mapCaseData)
      list = lodash.orderBy(list, 'profit').reverse()
      return filterProps(list, ['name', 'spent', 'profit'])
    },
    async listCaseBestRoi() {
      let list = await stats
        .getBy('type', 'case')
        .then(mergeCases)
        .then(mapCaseData)
      let roi = lodash.orderBy(list, 'roi').reverse()

      // format response
      return roi.map(({ name, price, roi, expectedValue }) => {
        roi = `${roi.toFixed(2)}% ($${expectedValue.toFixed(2)})`
        return {
          name,
          price,
          roi,
        }
      })
    },
    // USER STATS
    async caseOpenings() {
      let list = await listTopStats('user', 'caseOpenings')
      return filterProps(list, ['username', 'caseOpenings'])
    },
    async caseTotalAwarded() {
      let list = await listTopStats('user', 'caseTotalAwarded')
      return filterProps(list, ['username', 'caseTotalAwarded'])
    },
    listDailySnapshots() {
      return snapshots.listRecent()
    },
    listDailyBackups() {
      return backups.listRecent()
    },
  }
}
