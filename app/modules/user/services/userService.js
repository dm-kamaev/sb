'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const config = require('../../../../config/user-config/config');
const axios = require('axios').create({
    baseURL: `http://${config.host}:${config.port}`
});

exports.findSberUserById = function(id) {
    return await(sequelize.models.SberUser.findOne({
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

exports.findAuthUserByPhone = function(phoneNumber) {
    var authUsers = await(axios.get('/users', {
        params: {
            phone: phoneNumber
        }
    }));

    return authUsers.data[0];
};

exports.createAuthUser = function(userData) {
    var response = await(axios.post('/user', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
    }));

    return response.data;
};

exports.createSberUser = function(authId) {
    return await(sequelize.models.SberUser.create({
        authId,
        userFund: {
            draft: true
        }
    }, {
        include: [{
            model: sequelize.models.UserFund,
            as: 'userFund'
        }]
    }));
};

exports.findAuthUserByAuthId = function(authId) {
    var response = await(axios.get(`/user/${authId}`));
    return response.data;
};

exports.setAuthId = function(id, authId) {
    return await(sequelize.models.SberUser.update({
        authId
    }, {
        where: {
            id
        }
    }));
};

exports.updateAuthUser = function(authId, userData) {
    var response = await(axios.patch(`/user/${authId}`, {
        firstName: userData.firstName,
        lastName: userData.lastName
    }));
    return response.data;
};

exports.setUserFund = function(id, userFundId) {
    await(sequelize.sequelize_.transaction(async((t) => {
        await(sequelize.models.UserFund.update({
            creatorId: null
        }, {
            where: {
                creatorId: id
            }
        }));
        await(sequelize.models.UserFund.update({
            creatorId: id
        }, {
            where: {
                id: userFundId
            }
        }));
    })));
};
