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
        include: [{
            model: sequelize.models.UserFund,
            as: 'userFund',
            required: false,
            include: include ? [{
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
            }] : []
        }]
    }));
};

UserService.getOrders = function (id) {
    var sberUser = await(sequelize.models.SberUser.findOne({
        where: {
            id
        },
        include: {
            model: sequelize.models.UserFundSubscription,
            as: 'userFundSubscription',
            required: false,
            include: [{
                model: sequelize.models.Order,
                as: 'order',
                required: false,
                include: {
                    model: sequelize.models.OrderItem,
                    as: 'orderItem'
                }
            }, {
                model: sequelize.models.UserFund,
                as: 'userFund'
            }]
        }
    }))

    return sberUser.userFundSubscription.map(sub => Object.assign({}, sub.dataValues, {
        order: sub.order.map(order => Object.assign({}, order.dataValues, {
            userFund: sub.userFund.dataValues
        }))
    }))
        .reduce((prev, curr) => prev.order.concat(curr.order));
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
        lastName: userData.lastName
    }));
    return response.data;
};

UserService.setUserFund = function (id, userFundId) {
    return await(sequelize.sequelize_.transaction(t => {
        return sequelize.models.UserFund.update({
            creatorId: null
        }, {
            where: {
                creatorId: id
            }
        })
            .then(() => {
                return sequelize.models.UserFund.update({
                    creatorId: id
                }, {
                    where: {
                        id: userFundId
                    }
                });
            });
    }));
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

UserService.createCard = function (sberUserId, bindingId) {
    return await(sequelize.sequelize.transaction((t) => {
        return sequelize.models.Card.create({
            sberUserId,
            bindingId
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

module.exports = UserService;
