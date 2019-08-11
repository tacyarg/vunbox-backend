const AWS = require('aws-sdk')
const assert = require('assert')
const uuid = require('uuid/v4')

module.exports = config => {
  assert(config.region, 'region required')
  assert(config.accessKeyId, 'access key required')
  assert(config.secretAccessKey, 'secret access key required')

  const db = new AWS.DynamoDB.DocumentClient(config)

  return table => {
    const params = {
      TableName: table,
    }

    return {
      async get(id) {
        const { Item } = await db
          .get({
            ...params,
            Key: {
              id,
            },
          })
          .promise()

        return Item
      },
      async insert(row) {
        const id = row.id || uuid()
        await db
          .put({
            ...params,
            Item: {
              id,
              ...row,
            },
          })
          .promise()

        return id
      },
    }
  }
}
