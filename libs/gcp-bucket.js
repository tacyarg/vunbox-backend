const { Storage } = require('@google-cloud/storage')
const fs = require('fs')
const assert = require('assert')

module.exports = config => {
  // config = {
  //   projectId: config.projectId,
  //   keyFilename: config.keyFilename,
  // }
  const storage = new Storage(config)
  const bucket = storage.bucket(config.bucket)

  return {
    async listBuckets() {
      const [buckets] = await storage.getBuckets()
      return buckets.map(bkt => {
        return bkt.name
      })
    },
    writeStream(fileName) {
      assert(fileName, 'requires file name')

      return bucket.file(fileName).createWriteStream({
        gzip: true,
        contentType: 'application/json',
      })
    },
    readStream(fileName) {
      assert(fileName, 'requires file name')

      return bucket.file(fileName).createReadStream()
    },
    async listFiles() {
      const [files] = await bucket.getFiles()
      return files.map(file => file.metadata)
    },
  }
}
