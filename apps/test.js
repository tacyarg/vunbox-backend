require('dotenv').config()

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
