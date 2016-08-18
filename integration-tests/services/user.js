'use strict';

const randomstring = require('randomstring');
const faker = require('faker/locale/ru');

var service = {};

service.genRandomUser = function () {
    var result = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(this.firstName, this.lastName),
        password: faker.internet.password(8)
    };

    return result;
}

module.exports = service;
