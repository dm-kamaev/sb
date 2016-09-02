'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const userFundService = require('../services/userFundService');


var UserFundService = {};

UserFundService.createUserFund = function(data) {
    return await(sequelize.models.UserFund.create({
        title: data.title,
        description: data.description,
        creatorId: data.creatorId
    }));
};

UserFundService.updateUserFund = function(id, data) {
    return await(sequelize.models.UserFund.update(data, {
        where: {
            id,
            deletedAt: null
        },
    }));
};

UserFundService.getUserFund = function(id) {
    return await(sequelize.models.UserFund.findOne({
        where: {
            id
        }
    }));
};


UserFundService.getUserFundWithSberUser = function(id) {
    return await(sequelize.models.UserFund.findOne({
        where: {
            id
        },
        include: {
            model: sequelize.models.SberUser,
            as: 'owner',
            required: false,
        }
    }));
};


/**
 * get list user funds with data about user
 * @param  {[array]} listId [ 74, 73 ]
 * @return {[type]}
 */
UserFundService.getUserFundsWithSberUser = function(listId) {
    return await(sequelize.models.UserFund.findAll({
        where: {
            id: {
                $in: listId
            }
        },
        include: {
            model: sequelize.models.SberUser,
            as: 'owner',
            required: false,
        }
    }));
};


UserFundService.getUserFunds = function() {
    return await(sequelize.models.UserFund.findAll());
};


UserFundService.getTodayCreatedUserFunds = function() {
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

UserFundService.addEntity = function(id, entityId) {
    var count = await(sequelize.models.UserFundEntity.count({
        where: {
            entityId,
            userFundId: id
        }
    }));

    if (count) throw new Error(i18n.__('Relation exists'));

    return await(sequelize.models.UserFundEntity.create({
        entityId,
        userFundId: id
    }));
};

UserFundService.removeEntity = function(id, entityId) {
    return await(sequelize.models.UserFundEntity.destroy({
        where: {
            entityId,
            userFundId: id
        }
    }));
};

UserFundService.getEntities = function(id) {
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

    if (!userFund) throw new Error(i18n.__('Not found'));

    return userFund.entity;
};

UserFundService.getEntitiesCount = function(id) {
    return await(sequelize.models.UserFundEntity.count({
        where: {
            userFundId: id
        }
    }));
};

UserFundService.getUserFundsCount = function() {
    return await(sequelize.models.UserFund.count());
};

UserFundService.toggleEnabled = function(id, isEnabled) {
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

UserFundService.setAmount = function(sberUserId, userFundId, changer, amount, payDate) {
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

UserFundService.getCurrentAmount = function(sberUserId, userFundId) {
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


UserFundService.getUserFundSubscriptionId = function(sberUserId, userFundId) {
    return await(sequelize.models.UserFundSubsription.findOne({
        where: {
            sberUserId,
            userFundId
        }
    }));
};


/**
 * get user subscriptions by sberUserId
 * @param  {[int]}  sberUserId
 * @return {[type]}
 */
UserFundService.getUserFundSubsriptionsBySberUserId = function(sberUserId) {
    return await(sequelize.models.UserFundSubsription.findAll({
        where: {
            sberUserId,
        }
    }));
};


UserFundService.updateDesiredAmountHistory = function(id, data) {
    return await(sequelize.models.DesiredAmountHistory.update(data, {
        where: {
            id
        }
    }));
};

UserFundService.updateUserFundSubscription = function(id, data) {
    return await(sequelize.models.UserFundSubsription.update(data, {
        where: {
            id
        }
    }));
};


/**
 * get user subscriptions by sberUserId and returning data after update
 * @param  {[int]}  sberUserId
 * @return {[type]}
 */
UserFundService.updatUserFundSubsriptionBySberUserId = function(sberUserId, data) {
    return await(sequelize.models.UserFundSubsription.update(data, {
        where: {
            sberUserId,
        },
        returning: true,
    }))[1];
};



UserFundService.searchActiveUserFundSubsriptionByUserFundId = function(listUserFundId) {
    return await(sequelize.models.UserFundSubsription.findAll({
        where: {
            userFundId: {
                $in: listUserFundId,
            },
            enabled: true
        },
    }));
};


/**
 * if not own userfund then check exist and enable another userfund
 * @param  {[int]} ownUserFundId
 * @param  {[int]} userFundId
 * @return {[type]}
 */
UserFundService.checkEnableAnotherUserFund = function(ownUserFundId, userFundId) {
    // check whether userFund enabled if he is not the owner
    if (ownUserFundId !== userFundId) {
        var userFund = await(UserFundService.getUserFund(userFundId));
        if (!userFund) {
            throw new errors.NotFoundError(i18n.__('UserFund'), userFundId);
        }
        if (!userFund.enabled) {
            throw new errors.HttpError(i18n.__('UserFund disabled'), 400);
        }
    }
};
 /**
  * return unhandled subscriptions in this month
  * @param {int[]} allDates dates need to handle
  * @return {Object[]} UserFundSubscriptions array of UserFundSubscriptions
  * @return {Number} UserFundSubscription.userFundSubscriptionId id of subscription
  * @return {Object} UserFundSubscription.payDate date user desired to pay
  * @return {Number} UserFundSubscription.amount amount desired to pay
  * @return {Number} UserFundSubscription.sberUserId id of user
  * @return {Number} UserFundSubscription.userFundId if of userFund
  * @return {Number} UserFundSubscription.bindingId bindingId od of linked card
  * @return {Object} UserFundSubscription.realDate current date
  */
UserFundService.getUnhandledSubscriptions = function(allDates, nowDate) {
    console.log('nowDate: ', nowDate);
    return await(sequelize.sequelize.query(`
    SELECT DISTINCT ON ("UserFundSubsription"."id")
        "UserFundSubsription"."id" AS "userFundSubscriptionId",
        "payDayHistory"."payDate" AS "payDate",
        "DesiredAmountHistory"."amount" AS "amount",
        "SberUser"."id" AS "sberUserId",
        "UserFund"."id" AS "userFundId",
        "Card"."bindingId" AS "bindingId",
         :currentDate::timestamp AS "realDate"
    FROM "UserFundSubsription" AS "UserFundSubsription"
    INNER JOIN "UserFund" AS "userFund" ON "UserFundSubsription"."userFundId" = "userFund"."id"
    AND ("userFund"."deletedAt" IS NULL
          AND "userFund"."enabled" = TRUE)
    JOIN "PayDayHistory" AS "payDayHistory" ON "payDayHistory"."id" = (SELECT "id" FROM "PayDayHistory" WHERE "PayDayHistory"."subscriptionId" = "UserFundSubsription"."id"
                                                                                  AND date_part('day', "payDayHistory"."payDate") IN (:allDates)
                                                                                  ORDER BY "PayDayHistory"."createdAt" DESC LIMIT 1)
    JOIN "DesiredAmountHistory" ON "DesiredAmountHistory"."id" = "UserFundSubsription"."currentAmountId"
    JOIN "SberUser" ON "SberUser"."id" = "UserFundSubsription"."sberUserId"
    JOIN "UserFund" ON "UserFund"."id" = "UserFundSubsription"."userFundId"
    JOIN "Card" ON "SberUser"."currentCardId" = "Card"."id"
    WHERE "UserFundSubsription"."enabled" = TRUE
    AND "UserFundSubsription"."id" NOT IN (SELECT "id" FROM "UserFundSubsription" JOIN "Order" ON "UserFundSubsription"."id" = "Order"."userFundSubscriptionId"
                                                WHERE date_trunc('month', "Order"."scheduledPayDate") = date_trunc('month', :currentDate::date))`, {
                                                    type: sequelize.sequelize.QueryTypes.SELECT,
                                                    replacements: {
                                                        allDates,
                                                        currentDate: nowDate || new Date().toISOString()
                                                    }
                                                }));
};

/**
  * @param {int} subscriptionId id of subscription
  * @param {Object} payDate Date object, desired payDate
  * @return {Object} PayDate sequelize object
  */
UserFundService.setPayDate = function(subscriptionId, payDate) {
    return await(sequelize.models.PayDayHistory.create({
        subscriptionId,
        payDate
    }));
};

module.exports = UserFundService;
