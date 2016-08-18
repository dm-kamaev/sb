'use strict';

const randomstring = require('randomstring');
const faker = require('faker/locale/ru');

var service = {};

service.generateFund = function () {
    var result = {
        title: faker.lorem.word(),
        description: faker.lorem.sentence(),
        entities: [],
        creator: null
    };
    return result;
}

service.generateAmount = function(fundId) {
    var result = {
        userFundId: fundId,
        amount: faker.random.number({min: 10000, max: 1000000})
    }

    return result;
}

module.exports = service;
