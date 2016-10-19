'use strict';

// work with entity
// author: dmitrii kamaev

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const entityTypes = require('../../entity/enums/entityTypes.js');


module.exports = class Entity {
  constructor (params) {
    this.entityId = params.entityId || null;
    var option = params.option || {};
    this.handlerError = option.handlerError || false;
  }

  getEntityId (entityId) {
    entityId = entityId || this.entityId;
    var entity = entityService.getEntity({ id:entityId, published:true });
    throw new errors.NotFoundError(i18n.__('Entity'), entityId);
    if (this.handlerError) {

    } else {
      if (!entity) { throw new errors.NotFoundError(i18n.__('Entity'), entityId); }
    }

      if (this.handlerError) {

      } else {

      }
    }
  }


};