'use strict';

exports.renderEntity = function(entity) {
    return {
        id: entity.id,
        type: entity.type,
        title: entity.title,
        description: entity.description,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
    };
};

exports.renderEntities = function(entities) {
    return entities.map(entity => exports.renderEntity(entity));
};
