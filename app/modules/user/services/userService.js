'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const orderStatus = require('../../orders/enums/orderStatus.js');
const UserApi     = require('../../micro/services/microService.js').UserApi;

var UserService = {};

UserService.findSberUserById = function(id, include) {
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
        }, {
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


/**
 * get user orders
 * @param  {[int]}  sberUserId
 * @return {[type]}
 */
UserService.getOrders = function(sberUserId, orderStatus) {
    var query =
    `SELECT
        "scheduledPayDate",
        status,
        "Order"."createdAt" as "createdAt",
        "Order".status as status,
        "sberAcquOrderNumber",
        "sberAcquOrderId",
        amount,
        "userFundId",
        "Order".type as type,
        title,
        description,
        "Order"."userFundSnapshot" as "userFundSnapshot"
    FROM "Order"
    JOIN "UserFundSubscription" AS ufs
        ON ufs.id = "Order"."userFundSubscriptionId"
    JOIN "SberUser" AS su
        ON  su.id = ufs."sberUserId"
        AND su.id = :id
    JOIN "UserFund" AS uf
        ON ufs."userFundId" = uf.id
    WHERE status IN (:status)
    ORDER BY "createdAt" DESC`;

    return await(sequelize.sequelize.query(query, {
        type: sequelize.sequelize.QueryTypes.SELECT,
        replacements: {
            id: sberUserId,
            status: orderStatus
        }
    }));
};


UserService.findSberUserByAuthId = function(authId) {
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


UserService.findAuthUserByPhone = function(phoneNumber) {
    var users = new UserApi().getUserByParams({ phone: phoneNumber });
    return users[0] || {};
};


/**
 * create auth user
 * @param  {[obj]} userData
 * @return {[obj]} { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'LALAL1', lastName: 'LALAL', gender: null, phone: '123131', email: null, password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }
 */
UserService.createAuthUser = function(userData) {
    return new UserApi().register({
        firstName: userData.firstName,
        lastName:  userData.lastName,
        phone:     userData.phone
    });
};


UserService.createSberUser = function(authId) {
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


/**
 * find auth user by auth id
 * @param  {[int]} authId
 * @return {[obj]} { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }
 */
UserService.findAuthUserByAuthId = function(authId) {
    return new UserApi().getUserData(authId);
};


UserService.setAuthId = function(id, authId) {
    return await(sequelize.models.SberUser.update({
        authId
    }, {
        where: {
            id
        }
    }));
};


/**
 * update Auth User
 * @param  {[int]} authId   [description]
 * @param  {[obj]} userData {
*      "firstName": "Vasya",
*      "lastName": "Ivanov"
*      "email":    "vasya-ivanov@mail.ru"
* }
* @return {[obj]}  { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }
*/

UserService.updateAuthUser = function(authId, userData) {
    console.log(userData);
    return new UserApi().updateAuthUser({
        authId,
        firstName:userData.firstName,
        lastName: userData.lastName,
        email:    userData.email
    });
};


UserService.setUserFund = function(userFundId, oldUserFundId) {
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
            });
        });
    }));
};


/**
 * find auth user by email
 * @param  {[str]} email
 * @return {[obj]}  { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }
 */
UserService.findAuthUserByEmail = function(email) {
    var users = new UserApi().getUserByParams({ email });
    return users[0] || {};
};


UserService.createCard = function(sberUserId, data) {
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


/**
 * remove card
 * @param  {[int]} sberUserId
 * @return {[type]}            [description]
 */
UserService.removeCard = function(sberUserId) {
    return await(sequelize.models.Card.update({
        deletedAt: new Date()
    }, {
        where: {
            sberUserId
        }
    }));
};



UserService.getSberUsers = function(condinitions) {
    var where = {
        authId: {
            $ne: null
        }
    };
    if (condinitions) {
        Object.keys(condinitions).forEach(key => {
            where[key] = condinitions[key];
        });
    }
    return await(sequelize.models.SberUser.findAll({ where }));
};


/**
 * get auth users by ids
 * @param  {[str]} ids "1,2"
 * @return {[type]} [  { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }, ... ]
 */
UserService.getAuthUsersByIds = function(ids) {
    return new UserApi().getUserByParams({ id: ids });
};



UserService.getUserFundSubscriptions = function(id) {
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
}));
};

UserService.changeMailSubscription = function(userData, categories) {
    var sberUserId = userData.sberUserId,
        email      = userData.email;

    if (!sberUserId) {
        var authUser = UserService.findAuthUserByEmail(email)

        if (!authUser) { throw new Error('User not Found'); }

        sberUserId = UserService.findSberUserByAuthId(authUser.id)
    }

    return await(sequelize.models.SberUser.update({
        categories
    },{
        where: {
            id: sberUserId
        }
    }))
}

module.exports = UserService;
