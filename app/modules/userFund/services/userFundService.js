'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const userFundService = require('../services/userFundService');


exports.createUserFund = function(data) {
    return await(sequelize.models.UserFund.create({
        title: data.title,
        description: data.description,
        creatorId: data.creatorId
    }));
};

exports.updateUserFund = function(id, data) {
    return await(sequelize.models.UserFund.update(data, {
        where: {
            id,
            deletedAt: null
        }
    }));
};

exports.getUserFund = function(id) {
    return await(sequelize.models.UserFund.findOne({
        where: {
            id
        }
    }));
};

exports.getUserFunds = function() {
    return await(sequelize.models.UserFund.findAll());
};

exports.getTodayCreatedUserFunds = function() {
    var today = new Date(),
        year = today.getFullYear(),
        month = today.getMonth(),
        date = today.getDate();
    return await(sequelize.models.UserFund.count({
        where: {
            createdAt: {
                $lt: new Date(year, month, date + 1, 0, 0, 0, 0),
                $gt: new Date(year, month, date, 0, 0, 0, 0)
            }
        }
    }));
};

exports.addEntity = function(id, entityId) {
    var count = await(sequelize.models.UserFundEntity.count({
        where: {
            entityId,
            userFundId: id
        }
    }));

    if (count) throw new Error('Relation exists');

    return await(sequelize.models.UserFundEntity.create({
        entityId,
        userFundId: id
    }));
};

exports.removeEntity = function(id, entityId) {
    return await(sequelize.models.UserFundEntity.destroy({
        where: {
            entityId,
            userFundId: id
        }
    }));
};

exports.getEntities = function(id) {
    var userFund = await(sequelize.models.UserFund.findOne({
        where: {
            id
        },
        include: {
            model: sequelize.models.Entity,
            as: 'entity',
            required: false,
            include: {
                model: sequelize.models.Entity,
                as: 'fund',
                required: false
            }
        }
    }));

    if (!userFund) throw new Error('Not found');

    return userFund.entity;
};

exports.getUserFundsCount = function() {
    return await(sequelize.models.UserFund.count());
};

exports.toggleEnabled = function(id, isEnabled) {
    return await(sequelize.models.UserFund.update({
        enabled: isEnabled
    }, {
        where: {
            $and: [{
                enabled: !isEnabled
            }, {
                id: id
            }]
        }
    }));
};

exports.setAmount = function(sberUserId, userFundId, changer, amount, payDate) {
    return await(sequelize.sequelize_.transaction(t => {
        return sequelize.models.UserFundSubsription.findOrCreate({
            where: {
                userFundId,
                sberUserId
            }
        })
            .spread(subscription => subscription)
            .then(subscription => {
                return sequelize.models.DesiredAmountHistory.create({
                    subscriptionId: subscription.id,
                    payDate: payDate || Date.now(),
                    changer,
                    amount
                });
            })
            .then(amount => {
                return sequelize.models.UserFundSubsription.update({
                    currentAmountId: amount.id
                }, {
                    where: {
                        userFundId,
                        sberUserId
                    }
                });
            })
            .catch(err => {
                throw err;
            });
    }));
};

exports.getCurrentAmount = function(sberUserId, userFundId) {
    var suuf = await(sequelize.models.UserFundSubsription.findOne({
        where: {
            sberUserId,
            userFundId
        },
        include: [{
            model: sequelize.models.DesiredAmountHistory,
            as: 'currentAmount',
            required: false
        }]
    }));
    return suuf.currentAmount;
};


exports.getUserFundSubscriptionId = function(sberUserId, userFundId) {
    return await(sequelize.models.UserFundSubsription.findOne({
        where: {
            sberUserId,
            userFundId
        }
    }));
};

exports.updateDesiredAmountHistory = function(id, data) {
    return await(sequelize.models.DesiredAmountHistory.update(data, {
        where: {
            id
        }
    }));
};

exports.updateUserFundSubscription = function(id, data) {
    return await(sequelize.models.UserFundSubsription.update(data, {
        where: {
            id
        }
    }));
};


/**
 * if not own userfund then check exist and enable another userfund
 * @param  {[int]} ownUserFundId
 * @param  {[int]} userFundId
 * @return {[type]}
 */
exports.checkEnableAnotherUserFund = function (ownUserFundId, userFundId) {
    // check whether userFund enabled if he is not the owner
    if (ownUserFundId !== userFundId) {
        var userFund = await(userFundService.getUserFund(userFundId));
        if (!userFund)        { throw new errors.NotFoundError('UserFund', userFundId); }
        if (!userFund.enabled){ throw new errors.HttpError('UserFund disabled', 400);   }
    }
};