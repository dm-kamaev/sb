'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const config = require('../../../../config/config');
const axios = require('axios').create({
    baseURL: `http://${config.host}:${config.port}`
});

exports.findSberUserById = function(id) {
    return await(sequelize.models.SberUser.findOne({
        where: {
            id
        },
        include: {
            model: sequelize.models.UserFund,
            as: 'userFund',
            required: false
        }
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

exports.addUserFund = function(id, userFundId) {
    return await(sequelize.models.SberUser.update({
        userFundId
    }, {
        where: {
            id
        }
    }));
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
        authId
    }));
};

exports.findAuthUserByAuthId = function(authId) {
    var response = await(axios.get(`/user/${authId}`));
    return response.data;
};
