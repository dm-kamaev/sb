'use strict';

const os = require('os');
const config = require('../../../../config/config.json');
const BASE_URL = `${config.hostname.replace(/\/+$/, '')}:${config.port}`

exports.renderEntity = function(entity) {
    return {
        id: entity.id,
        type: entity.type,
        title: entity.title,
        description: entity.description,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        imgUrl: `${BASE_URL}/${entity.imgUrl}`,
        checked: entity.userFund && !!entity.userFund.length || false, // if user checked this entity
        published: entity.published,
        funds: entity.fund && exports.renderEntities(entity.fund),
        directions: entity.direction && exports.renderEntities(entity.direction),
        topics: entity.topic && exports.renderEntities(entity.topic),
        sum: entity.sum
    };
};

exports.renderEntities = function(entities) {
    return entities.map(exports.renderEntity);
};
