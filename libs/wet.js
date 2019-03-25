const assert = require('assert')
const axios = require('axios')
const join = require('url-join')

const BASE_URL = 'https://api-trade.opskins.com'

module.exports = function(config = {}) {
  assert(config, 'requires api config')

  // function callAPI(method, endpoint, params) {
  //   var url = join(BASE_URL, endpoint)

  //   // set default params to include the API_KEY
  //   if (!params) params = {}
  //   params.key = config.key

  //   if (method === 'get')
  //     params = {
  //       params,
  //     }

  //   return axios[method](url, params)
  //     .then(res => res.data)
  //     .catch(err => {
  //       if (err.response) {
  //         throw new Error(err.response.data.message)
  //       } else {
  //         console.log('expresstrade error', err.message)
  //         throw new Error(err.message)
  //       }
  //     })
  // }

  function callCaseAPI(method, endpoint, params) {
    // assert(config.key, 'caseapi key required: IUser/CreateVCaseUser/v1/')
    var url = join(BASE_URL, endpoint)

    // set default params to include the API_KEY
    if (!params) params = {}
    params.key = config.key

    if (method === 'get')
      params = {
        params,
      }

    return axios[method](url, params)
      .then(res => res.data)
      .catch(err => {
        if (err.response) {
          throw new Error(err.response.data.message)
        } else {
          console.log('expresstrade error', { err })
          throw new Error(err)
        }
      })
  }

  return {
    async listCases() {
      const { response } = await callCaseAPI('get', 'ICase/GetCaseSchema/v1')
      return response.cases.map(box => {
        return {
          id: box.id.toString(),
          name: box.name,
          image: box.image['300px'],
          maxOpenings: box.max_opens,
          openingsRemaining: box.remaining_opens,
          keyPrice: box.key_amount_per_case,
          price: box.key_amount_per_case * 2.5,
          itemCount: box.skus.length,
        }
      })
    },
  }
}
