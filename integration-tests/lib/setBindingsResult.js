'use strict'

const services = require('../services')
const chakram = require('chakram')
const expect = chakram.expect

module.exports = function(isFail) {
    var url = services.url.concatEmulUrl(`failBindings/${!isFail ? '1' : '0'}`)
    return chakram.post(url);
}
