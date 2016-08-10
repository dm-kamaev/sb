'use strict';

const randomstring = require('randomstring');
const faker = require('faker/locale/ru');

const TYPE = ['fund', 'topic', 'direction'];

var service = {};

module.exports = service;

service.generateEntities = function(number) {
    var result = [];
    for (var i = 0; i < number; i++) {
        var entity = {}
        entity.title = faker.hacker.verb();
        entity.description = faker.hacker.phrase();
        entity.type = service.getRandomType();
        entity.published = true;
        result.push(entity);
    }
    return result;
};

service.getRandomType = function() {
    var index = Math.floor(Math.random() * 2);
    return TYPE[index];
}
