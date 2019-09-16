module.exports = ({ users, items, cases, statsCache }) => {

  let totalEvents = 0
  const boxes = {}

  const handleCaseEvent = async event => {
    // simple cache to optimize processing speed...
    if (!boxes[event.caseId]) {
      event.box = await cases.get(event.caseId)
      boxes[event.caseId] = event.box
    } else {
      event.box = boxes[event.caseId]
    }

    users.save(event.userId, {
      username: event.userName,
      avatar: event.userAvatar,
    })

    items.upsert({
      id: event.item.name,
      name: event.item.name,
      price: event.item.price,
      rarity: event.item.rarity,
      image: event.item.image,
    })

    return [
      statsCache.processCaseEvent(event.userId, event),
      statsCache.processAdditionalCaseStats(event.userId, event),
      statsCache.processCaseEvent('global', event),
      statsCache.processAdditionalCaseStats('global', event),
    ]
  }

  const handleTradeEvent = async event => {
    const results = []

    // sometimes sender is null
    if (event.sender) {
      users.save(event.recipient.userId, {
        username: event.recipient.userName,
      })
      const stats = statsCache.processTradeEvent(event.sender.userId, event)

      //save update to array of pending writes.
      results.push(stats)
    }

    if (event.recipient) {
      users.save(event.sender.userId, {
        username: event.sender.userName,
      })
      const stats = statsCache.processTradeEvent(event.recipient.userId, event)

      //save update to array of pending writes.
      results.push(stats)
    }

    // flush writes into the stream.
    return [...results, statsCache.processTradeEvent(event.item.name, event)]
    // return [...results]
  }

  // route the event type to the correct topic processor.
  return async event => {
    console.log('handleEvent:', ++totalEvents, event.type, event.id)
    switch (event.type) {
      case 'case-opened':
        return handleCaseEvent(event)
      case 'trade-offers':
        return handleTradeEvent(event)
    }
  }
}
