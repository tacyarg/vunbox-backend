require('dotenv').config()

// basic service that can be used to test the image.

module.exports = async config => {
  return {
    async ping() {
      return 'pong'
    },
    async echo(params) {
      return params
    }
  }
}
