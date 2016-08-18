'use strict';

const randomstring = require('randomstring');
const faker = require('faker');

var service = {};

service.genRandomUser = function () {
    faker.locale = 'en';
    var newEmail = faker.internet.email();
    faker.locale = 'ru';

    var result = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: newEmail,
        password: faker.internet.password(8)
    };

    return result;
}

module.exports = service;
