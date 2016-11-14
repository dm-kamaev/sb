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
        this.subscriptionId       = params.subscriptionId || null;
        this.UserFundSubscription = sequelize.models.UserFundSubscription;
        this.DesiredAmountHistory = sequelize.models.DesiredAmountHistory;
        this.PayDayHistory        = sequelize.models.PayDayHistory;
    }

    setSubscription(subscription) {
        this.subscription = subscription;
        return subscription;
    }

    /**
     * get subscription
     * @return {[type]} [description]
     */
    getSubscription() {
        var sberUserId = this.sberUserId, userFundId = this.userFundId;
        var subscription = await(sequelize.models.UserFundSubscription.findOne({
            where: {
                sberUserId,
                userFundId
            }
        }));
        return this.setSubscription(subscription);
    }


    /**
     * get subscription id
     * @return {[type]} [description]
     */
    getId () {
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


    /**
     * enable subscription and set new pay date
     * @return {[type]} [description]
     */
    enableAndSetNewPayDate() {
        var subscriptionId = this.subscription.id,
            self           = this;
        function transaction(t) {
            return self.UserFundSubscription.update({
                    enabled: true
                }, {
                    where: {
                        id: subscriptionId
                    }
                })
                .then(() => {
                    return self.PayDayHistory.findOrCreate({
                        where: { subscriptionId },
                        defaults: {
                            payDate: new Date()
                        }
                    })
                });
        }
        return await(sequelize.sequelize.transaction(transaction));
    }


    /**
     * create pay date
     * @param  {[Date]} payDate
     * @return {[type]}         [description]
     */
    createPayDate(payDate) {
        var subscriptionId = this.subscriptionId;
        await(this.PayDayHistory.create({
            subscriptionId,
            payDate
        }));
    }
}
