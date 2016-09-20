'use strict';

const os = require('os');
const config = require('../../../../config/config.json')

exports.renderEntity = function(entity) {
    return {
        id: entity.id,
        type: entity.type,
        title: entity.title,
        description: entity.description,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        imgUrl: `${config.hostname}/${entity.imgUrl}`,
        checked: entity.userFund && !!entity.userFund.length || false,
        published: entity.published,
        funds: entity.fund && exports.renderEntities(entity.fund),
        directions: entity.direction && exports.renderEntities(entity.direction),
        topics: entity.topic && exports.renderEntities(entity.topic)
    };
};

exports.renderEntities = function(entities) {
    return entities.map(exports.renderEntity);
};
