'use strict';

// work with subscription
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const i18n   = require('../../../components/i18n');
const UserFundApi = require('./userFundApi.js');

module.exports = class SubscriptionApi extends UserFundApi {
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
        this.UserFundSubscription = sequelize.models.UserFundSubscription;
        this.DesiredAmountHistory = sequelize.models.DesiredAmountHistory;
    }


    /**
     * get subscription
     * @return {[type]} [description]
     */
    getSubscription() {
        var sberUserId = this.sberUserId, userFundId = this.userFundId;
        return await(sequelize.models.UserFundSubscription.findOne({
            where: {
                sberUserId,
                userFundId
            }
        }));
    }


    /**
     * get subscription id
     * @return {[type]} [description]
     */
    getSubscriptionId () {
        var subscription = this.getSubscription() || {};
        return subscription.id;
    }


    /**
     * create record in UserFundSubscription and DesiredAmountHistory,
     * then update UserFundSubscription (insert currentAmountId  from DesiredAmountHistory)
     * @param {[obj]} params {
     *    changer    [str] –– 'user' || 'admin',
     *    amount     [int] –– in cents,
     * }
     */
    setAmount(data) {
        var sberUserId = this.sberUserId,
            userFundId = this.userFundId,
            changer    = data.changer,
            amount     = data.amount,
            self       = this;

        function createTransaction(transact) {
            return self.UserFundSubscription.findOrCreate({
                where: {
                    userFundId,
                    sberUserId
                }
            }).spread(subscription => subscription)
                  .then(createRecordAmount)
                  .then(setCurrentAmountId)
                  .catch(err => { throw err; });
        }

        function createRecordAmount(subscription) {
            var recordAmount = {
                subscriptionId: subscription.id,
                changer,
                amount,
            };

            return self.DesiredAmountHistory.create(recordAmount);
        }

        function setCurrentAmountId(desiredAmount) {
            return self.UserFundSubscription.update({
                currentAmountId: desiredAmount.id
            }, {
                where: {
                    userFundId,
                    sberUserId
                }
            });
        }
        return await(sequelize.sequelize_.transaction(createTransaction));
    }
}
