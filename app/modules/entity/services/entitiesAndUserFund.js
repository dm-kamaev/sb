'use strict';

// work with entity and user's userFund
// author: dmitrii kamaev

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const entityTypes = require('../../entity/enums/entityTypes.js');
const FUND      = entityTypes.FUND,
      DIRECTION = entityTypes.DIRECTION,
      TOPIC     = entityTypes.TOPIC;

module.exports = class EntitiesAndUserFund {
    /**
     * [constructor description]
     * @param  {[obj]} params {
     *   userFundId, // int
     *   published, // boolean
     *  }
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.userFundId = params.userFundId || null;
        this.published  = params.published || null;

        this.Entity   = sequelize.models.Entity;
        this.UserFund = sequelize.models.UserFund;
    }

    /**
     * getByType get entities with userFund by type
     * @param  {[type]} types [ 'fund', 'direction', 'topic']
     * @return {[obj]}       [ { id, title, type, userFund: [{}, ...] }, ... ]
     */
    getByType(types) {
        // [ { type: 'direction' }, { type: 'fund' } ]
        const $or = types.map(type => ({ type }));
        const published = this.published;
        const self = this;
        return await(this.Entity.findAll({
          where: {
              published,
              $or,
          },
          include: {
              model: self.UserFund,
              as: 'userFund',
              where: {
                  id: self.userFundId
              },
              required: false
          }
      }));
    }


    /**
     * getTopicsContainDirections get topics contains directions and userFund
     * @return {[obj]} [ { id, title, type, userFund: [{}, ...], direction:[{id, title, }], }, ... ]
     */
    getTopicsContainDirections() {
        const self = this, published = self.published;
        return await(self.Entity.findAll({
            where: {
                type: TOPIC,
                published
            },
            include: [{
                model: self.Entity,
                as: 'direction',
                required: false
            }, {
                model: self.UserFund,
                as: 'userFund',
                where: {
                    id: self.userFundId
                },
                required: false
            }],
        }));
    }
};


