'use strict';

const await = require('asyncawait/await');
const config = require('../../../../config/auth-config/config');
const sequelize = require('../../../components/sequelize');
const TIMEOUT = 1000 * 60 * 5;
const axios = require('axios').create({
    baseURL: `http://${config.host}:${config.port}`
});

class TimerError extends Error {
    constructor(time) {
        var diff = time - new Date(new Date() - TIMEOUT),
            mins = Math.floor(diff / (1000 * 60)),
            seconds = Math.floor(diff / 1000) % 60;

        super(`Попробуйте снова через ${mins}:${seconds}`);

        this.name = 'TimerError';
        Error.captureStackTrace(this, this.constructor);
    }
}

exports.createAuthUser = function(userData) {
    var response = await(axios.post('/user', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        password: '+'
    }));

    return response.data;
};

exports.saveCode = function(phone, code, sberUserId) {
    var send = await(sequelize.models.Phone.findOne({
        where: {
            number: phone,
            updatedAt: {
                $gt: new Date(new Date() - TIMEOUT)
            }
        }
    }));

    if (send) throw new TimerError(send.updatedAt);

    return await(sequelize.models.Phone.upsert({
        number: phone,
        code,
        sberUserId,
        verified: false
    }
  ));
};

exports.sendCode = function(phone, code) {
    // sending SMS to the user...
};

exports.verifyCode = function(phone, code) {
    return await(sequelize.models.Phone.update({
        verified: true
    }, {
        where: {
            number: phone,
            code
        }
    }));
};
