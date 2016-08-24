'use strict';

const randomstring = require('randomstring');
//const faker = require('faker/locale/ru');
const Chance = require('chance');
const chance = new Chance();

var service = {};

service.generateFund = function () {
    var result = {
        title: chance.word(),
        description: chance.sentence(),
        entities: [],
        creator: null
    };
    return result;
}

service.generateAmount = function(fundId) {
    var result = {
        userFundId: fundId,
        amount: chance.natural({min: 10000, max: 1000000})
    }

    return result;
}

module.exports = service;
