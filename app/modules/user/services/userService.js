'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const config = require('../../../../config/user-config/config');
const axios = require('axios').create({
    baseURL: `http://${config.host}:${config.port}`
});

var UserService = {};

UserService.findSberUserById = function (id, include) {
    return await(sequelize.models.SberUser.findOne({
        where: {
            id
        },
        include: include ? [{
            model: sequelize.models.UserFund,
            as: 'userFund',
            include: [{
                model: sequelize.models.Entity,
                as: 'fund',
                required: false
            }, {
                model: sequelize.models.Entity,
                as: 'topic',
                required: false
            }, {
                model: sequelize.models.Entity,
                as: 'direction',
                required: false
            }]
        },{
            model: sequelize.models.Card,
            as: 'currentCard',
            required: false
        }] : [{
            model: sequelize.models.UserFund,
            as: 'userFund'
        }]
    }, {
        order: [{
            model: sequelize.models.PayDayHistory,
            as: 'payDayHistory'
        }, 'createdAt', 'DESC'],
        limit: 1
    }));
};

UserService.getOrders = function (id) {
    return await(sequelize.sequelize.query(`SELECT
  "scheduledPayDate",
  "Order"."createdAt" as "createdAt",
  "Order".status as status,
  "sberAcquOrderNumber",
  "sberAcquOrderId",
  "amount",
  "userFundId",
  "Order".type as type,
  "title",
  "description"
FROM "Order"
JOIN "UserFundSubscription"
    ON "UserFundSubscription"."id" = "Order"."userFundSubscriptionId"
JOIN "SberUser"
  ON "SberUser"."id" = "UserFundSubscription"."sberUserId"
  AND "SberUser".id = :id
JOIN "UserFund"
  ON "UserFundSubscription"."userFundId" = "UserFund".id`, {
        type: sequelize.sequelize.QueryTypes.SELECT,
        replacements: {
            id
        }
    }));

    var orders = [];
    sberUser.userFundSubscription.forEach(sub => {
        orders = orders.concat(sub.order.map(order => Object.assign(order, {
            userFund: sub.userFund
        })))
    });
    return orders
}

/**
 * if verify card user then exist data else null
 * @param  {[int]} sberUserId [description]
 * @return {[type]}           [description]
 */
UserService.findCardBySberUserId = function (sberUserId) {
    return await(sequelize.models.SberUser.findOne({
        where: {
            id: sberUserId
        }
    }));
};

UserService.findSberUserByAuthId = function (authId) {
    return await(sequelize.models.SberUser.findOne({
        where: {
            authId
        },
        include: {
            model: sequelize.models.UserFund,
            as: 'userFund',
            required: false
        }
    }));
};

UserService.findAuthUserByPhone = function (phoneNumber) {
    var authUsers = await(axios.get('/users', {
        params: {
            phone: phoneNumber
        }
    }));

    return authUsers.data[0];
};

UserService.createAuthUser = function (userData) {
    var response = await(axios.post('/user', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
    }));

    return response.data;
};

UserService.createSberUser = function (authId) {
    return await(sequelize.models.SberUser.create({
        authId,
        userFund: {
            enabled: false
        }
    }, {
        include: [{
            model: sequelize.models.UserFund,
            as: 'userFund'
        }]
    }));
};

UserService.findAuthUserByAuthId = function (authId) {
    var response = await(axios.get(`/user/${authId}`));
    return response.data;
};

UserService.setAuthId = function (id, authId) {
    return await(sequelize.models.SberUser.update({
        authId
    }, {
        where: {
            id
        }
    }));
};

UserService.updateAuthUser = function (authId, userData) {
    var response = await(axios.patch(`/user/${authId}`, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
    }));
    return response.data;
};

UserService.setUserFund = function (userFundId, oldUserFundId) {
    return await(sequelize.sequelize.transaction(t => {
        return sequelize.models.UserFundEntity.destroy({
            where: {
                userFundId: oldUserFundId
            }
        })
        .then(() => {
            return sequelize.models.UserFundEntity.update({
                userFundId: oldUserFundId
            }, {
                where: {
                    userFundId
                }
            })
        })
    }))
};

UserService.findAuthUserByEmail = function (email) {
    var response = await(axios.get('/users', {
        params: {
            email
        }
    }));

    var users = response.data;
    return users[0];
};

UserService.createCard = function (sberUserId, data) {
    return await(sequelize.sequelize.transaction((t) => {
        return sequelize.models.Card.create({
            sberUserId,
            bindingId: data.bindingId,
            PAN: data.PAN,
            expiration: data.expiration,
            cardHolderName: data.cardHolderName
        })
            .then(card => {
                return sequelize.models.SberUser.update({
                    currentCardId: card.id
                }, {
                    where: {
                        id: sberUserId
                    }
                });
            });
    }));
};

UserService.getSberUsers = function () {
    return await(sequelize.models.SberUser.findAll({
        where: {
            authId: {
                $ne: null
            }
        }
    }))
}

UserService.getAuthUsersByIds = function (ids) {
    var response = await(axios.get('/users', {
        params: {
            id: ids
        }
    }))

    return response.data;
}

UserService.getUserFundSubscriptions = function (id) {
    return await(sequelize.sequelize.query(`SELECT
  "UserFundSubscription".id as id,
  "UserFundSubscription"."userFundId" as "userFundId",
  "UserFundSubscription"."sberUserId" as "sberUserId",
  "UserFundSubscription".enabled as enabled,
  date_part('day', "payDate") as "payDate",
  "DesiredAmountHistory".amount as amount,
  "Order"."scheduledPayDate" as "scheduledPayDate",
  "Order"."createdAt" as "realPayDate",
  "UserFund".title as title,
  "UserFund".description as description
FROM "UserFundSubscription"
LEFT JOIN "PayDayHistory" ON "PayDayHistory".id = (SELECT "PayDayHistory".id
                                                    FROM "PayDayHistory"
                                                    WHERE "PayDayHistory"."subscriptionId" = "UserFundSubscription".id
                                                    ORDER BY "PayDayHistory"."createdAt" DESC
                                                    LIMIT 1)
LEFT JOIN "Order" ON "Order"."sberAcquOrderNumber" = (SELECT "Order"."sberAcquOrderNumber"
                                                          FROM "Order"
                                                          WHERE "Order"."userFundSubscriptionId" = "UserFundSubscription".id
                                                          ORDER BY "Order"."createdAt" DESC
                                                          LIMIT 1)
JOIN "DesiredAmountHistory" ON "UserFundSubscription"."currentAmountId" = "DesiredAmountHistory".id                                                           
JOIN "UserFund" ON "UserFund".id = "UserFundSubscription"."userFundId"
WHERE "sberUserId" = :id`, {
        type: sequelize.sequelize.QueryTypes.SELECT,
        replacements: {
            id
        }
    }))
}

module.exports = UserService;
