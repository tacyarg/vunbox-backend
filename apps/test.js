require('dotenv').config()

module.exports = async config => {
  return {
    ping() {
      return 'pong'
    },
    echo(params) {
      return params
    }
  }
}
