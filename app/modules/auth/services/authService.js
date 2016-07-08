'use strict';

const await = require('asyncawait/await');
const config = require('../../../../config/auth-config/config');
const axios = require('axios').create({
    baseURL: `http://${config.host}:${config.port}`
});

exports.createAuthUser = function(userData) {
    var response = await(axios.post('/user', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        password: '+'
    }));

    return response.data;
};
