'use strict';

// work with userFund
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const userFundService = require('../services/userFundService');
const entityTypes = require('../../entity/enums/entityTypes.js');

module.exports = class UserFund {
    /**
     * constructor
     * @param  {[obj]} params {
     *    userFundId,
     * }
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.userFundId = params.userFundId || null;
    }


    /**
     * get Entity from userFund
     * @param  {[obj]} data {
     *   userFundId, // optional
     *   type,       // get type
     * }
     * @return {[array]}  [ { id, title, description }, { id, title, description }]
     */
    getEntity(data) {
        data = data || {};
        var userFundId = data.userFundId || this.userFundId;
        var userFund = userFundService.getUserFund(userFundId, true, true);
        var topics     = userFund.topic     || [],
            directions = userFund.direction || [],
            funds      = userFund.fund      || [];
        switch (data.type) {
            case entityTypes.TOPIC:
                return topics;
                break;
            case entityTypes.DIRECTION:
                return directions;
                break;
            case entityTypes.FUND:
                return funds;
                break;
            default:
                return topics.concat(directions).concat(funds);
        }
    }

};