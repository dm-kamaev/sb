'use strict';

const randomstring = require('randomstring');
const Chance = require('chance');
const chance = new Chance();

const TYPE = ['fund', 'topic', 'direction'];

var service = {};

module.exports = service;

service.generateEntities = function(number) {
    var result = [];
    for (var i = 0; i < number; i++) {
        var entity = {};
        entity.title = chance.word();
        entity.description = chance.sentence();
        entity.type = service.getRandomType();
        entity.published = true;
        entity.entities = [];
        result.push(entity);
    }
    return result;
};

service.getRandomType = function() {
    var index = Math.floor(Math.random() * 2);
    return TYPE[index];
}
