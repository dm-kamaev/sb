'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const config = require('../../../../config/user-config/config');
const axios = require('axios').create({
    baseURL: `http://${config.host}:${config.port}`
});

exports.findSberUserById = function(id) {
    return await (sequelize.models.SberUser.findOne({
        where: {
            id
        },
        include: [{
            model: sequelize.models.UserFund,
            as: 'userFund',
            required: false
        }, {
            model: sequelize.models.Phone,
            as: 'phone',
            required: false
        }],
        order: [
            [{
                    model: sequelize.models.Phone,
                    as: 'phone'
                },
                'updatedAt',
                'DESC'
            ]
        ]
    }));
};

exports.findSberUserByAuthId = function(authId) {
    return await (sequelize.models.SberUser.findOne({
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

exports.findAuthUserByPhone = function(phoneNumber) {
    var authUsers = await (axios.get('/users', {
        params: {
            phone: phoneNumber
        }
    }));

    return authUsers.data[0];
};

exports.createAuthUser = function(userData) {
    var response = await (axios.post('/user', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
    }));

    return response.data;
};

exports.createSberUser = function(authId) {
    return await (sequelize.models.SberUser.create({
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

exports.findAuthUserByAuthId = function(authId) {
    var response = await (axios.get(`/user/${authId}`));
    return response.data;
};

exports.setAuthId = function(id, authId) {
    return await (sequelize.models.SberUser.update({
        authId
    }, {
        where: {
            id
        }
    }));
};

exports.updateAuthUser = function(authId, userData) {
    var response = await (axios.patch(`/user/${authId}`, {
        firstName: userData.firstName,
        lastName: userData.lastName
    }));
    return response.data;
};

exports.setUserFund = function(id, userFundId) {
    return await (sequelize.sequelize_.transaction(t => {
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

exports.findAuthUserByEmail = function(email) {
    var response = await (axios.get('/users', {
        params: {
            email
        }
    }));

    var users = response.data;
    return users[0];
};

exports.createCard = function(sberUserId, bindingId) {
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
                })
            })
    }))
}
