'use strict';

const os = require('os');

exports.renderEntity = function(entity) {
    return {
        id: entity.id,
        type: entity.type,
        title: entity.title,
        description: entity.description,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        imgUrl: `http://${os.hostname()}:3000/${entity.imgUrl}`,
        checked: entity.userFund && !!entity.userFund.length,
        published: entity.published
    };
};

exports.renderEntities = function(entities) {
    return entities.map(exports.renderEntity);
};
