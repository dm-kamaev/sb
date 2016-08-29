'use strict';

const randomstring = require('randomstring');
const Chance = require('chance');
const chance = new Chance();
var service = {};

service.genRandomUser = function () {

    var result = {
        firstName: chance.first(),
        lastName: chance.last(),
        email: chance.email(),
        password: chance.string({length: 8})
    };

    return result;
}

service.genRandomNumber = function () {
    var result = {
        phone: chance.natural({min: 100000000, max: 999999999})
    }
    return result;
}

service.genRandomOldUser = function () {
    var result = {
        firstName: chance.first(),
        lastName: chance.last()
    }
    return result;
}

module.exports = service;
