const assert = require('assert')

exports.user = props => {
  assert(props.id, 'id required')
  return {
    type: 'user',
    caseOpenings: 0,
    caseTotalAwarded: 0,
    tradesCount: 0,
    tradesTotalValue: 0,
    outgoingTradesCount: 0,
    outgoingTradesTotal: 0,
    incomingTradesCount: 0,
    incomingTradesTotal: 0,
    tradesProfit: 0,
    bestItemUnboxed: null,
    worstItemUnboxed: null,
    bestItemTraded: null,
    worstItemTraded: null,
    caseTotalSpent: 0,
    caseTotalProfit: 0,
    caseTotalRake: 0,
    created: Date.now(),
    updated: Date.now(),
    ...props,
  }
}

exports.item = props => {
  assert(props.id, 'id required')
  return {
    type: 'item',
    caseOpenings: 0,
    caseTotalAwarded: 0,
    tradesCount: 0,
    tradesTotalValue: 0,
    created: Date.now(),
    updated: Date.now(),
    ...props,
  }
}

exports.case = props => {
  assert(props.id, 'id required')
  return {
    type: 'case',
    caseOpenings: 0,
    caseTotalAwarded: 0,
    bestItemUnboxed: null,
    worstItemUnboxed: null,
    caseTotalSpent: 0,
    caseTotalProfit: 0,
    created: Date.now(),
    updated: Date.now(),
    ...props,
  }
}

exports.caseSite = props => {
  assert(props.id, 'id required')
  return {
    ...exports.case(props),
    type: 'casesite',
    caseTotalSpent: 0,
    caseTotalOpened: 0,
    caseTotalAwarded: 0,
    caseTotalProfit: 0,
    caseTotalRake: 0,
    created: Date.now(),
    updated: Date.now(),
    ...props,
  }
}
