'use strict';

// work with subscriptions
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const i18n   = require('../../../components/i18n');
const UserFundApi = require('./userFundApi.js');

module.exports = class SubscriptionsApi extends UserFundApi {
    /**
     * constructor
     * @param  {[obj]} params {
     *    sberUserId
     *    userFundId,
     * }
     * @return {[type]}        [description]
     */
    constructor(params) {
        super(params);

        this.subscriptionId = params.subscriptionId || null;
        this.userFundId     = params.userFundId     || null;

        this.UserFundSubscription =  sequelize.models.UserFundSubscription;
    }


    /**
     * get subscription
     * @return {[type]} [description]
     */
    get(where) {
       const self = this;
       where = where || {};
       if (!Object.keys(where).length) {
            where = { userFundId: self.userFundId };
       }
       return await(self.UserFundSubscription.findAll({ where })) || [];
    }


    /**
     * turn off subscriptions on userFund
     * @return {[type]} [description]
     */
    turnOff() {
        var self       = this,
            userFundId = this.userFundId;

        await(self.UserFundSubscription.update({
            enabled: false
        },{
            where: {
                userFundId
          }
        }));
    }
}
