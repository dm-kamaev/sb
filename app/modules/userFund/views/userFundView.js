'use strict';

exports.renderUserFund = function(userFund) {
    return {
        id: userFund.id,
        title: userFund.title,
        description: userFund.description,
        enabled: userFund.enabled,
        creatorId: userFund.creatorId,
        createdAt: userFund.createdAt,
        updatedAt: userFund.updatedAt,
        fund: userFund.fund,
        direction: userFund.direction,
        topic: userFund.topic
    };
};

exports.renderUserFunds = function(userFunds) {
    return userFunds.map(exports.renderUserFund);
};


/**
 * render entities which add/remove from userFund
 * @param  {[array]}     entities  [{"id": 3, "title": "МОЙ ФОНД", "description": "lorem ipsum", "imgUrl": "entity_pics/defaultFund.png", "type": "fund", "published": true, "createdAt": "2016-07-29T11:07:44.146Z", "updatedAt": "2016-08-02T14:08:07.058Z", "deletedAt": null }, {"id": 2, "title": "ПОДАРИ ЖИЗНь", "description": "lorem ipsum", "imgUrl": "entity_pics/defaultFund.png", "type": "fund", "published": true, "createdAt": "2016-07-29T09:51:06.904Z", "updatedAt": "2016-08-02T14:08:07.058Z", "deletedAt": null }, ]
 * @return {[array]}
 */
exports.renderEntities = function(entities) {
    entities = entities || [];
    return entities.map(renderEntity_);
};


function renderEntity_ (entity) {
    return {
        id: entity.id,
        title: entity.title,
        description: entity.description,
        imgUrl: entity.imgUrl,
        "type": entity.type,
    };
}
