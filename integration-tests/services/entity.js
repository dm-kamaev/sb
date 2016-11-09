'use strict';

const randomstring = require('randomstring');
const Chance = require('chance');
const chance = new Chance();
const entityTypes = require('../../app/modules/entity/enums/entityTypes.js');

var service = {};

module.exports = service;

/**
 * generate Entities by type (or random) and numbers
 * @param  {[int]} number 2
 * @param  {[str || undefined]} type   'fund' || 'topic' || 'direction' || undefined
 * @return {[array]}  [ { title: 'no', description: 'Mockegu gahuwiw pada tool minpibuz kifavwu kofko mogad sacaji ihewepep hieha dimmadtib husda ej kug.', type: 'fund', imgUrl: 'entity_pics/defaultFund.png', published: true, entities: [] } ]
 */
service.generateEntities = function(number, type) {
    var result = [];
    for (var i = 0; i < number; i++) {
        var entity = {};
        entity.title = chance.word();
        entity.description = chance.sentence();
        if(type !== undefined) {
            entity.type = type;
        } else {
            entity.type = service.getRandomType();
        }
        var imgUrl = 'entity_pics/';
        switch (entity.type) {
          case 'topic':
            imgUrl += 'defaultTopic.png';
            break;
          case 'direction':
            imgUrl += 'defaultDirection.png';
            break;
          default:
            imgUrl += 'defaultFund.png';
        }
        entity.imgUrl = imgUrl;
        entity.published = true;
        entity.entities = [];
        result.push(entity);
    }
    return result;
};

service.getRandomType = function() {
    var index = Math.floor(Math.random() * 2);
    return Object.keys(entityTypes).map(key => key.toLowerCase())[index];
}
