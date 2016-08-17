'use strict';

const randomstring = require('randomstring');
const faker = require('faker/locale/ru');

var service = {};

service.genRandomUser = function () {
    var result = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password()
    };

    return result;
}

module.exports = service;
