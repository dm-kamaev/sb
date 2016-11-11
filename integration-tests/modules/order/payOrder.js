'use strict'

const chakram = require('chakram')

module.exports = function(context) {
    return function() {
      return chakram.get(context.formUrl)
    }
}
