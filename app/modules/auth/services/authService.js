'use strict';

const await = require('asyncawait/await');
const config = require('../../../../config/auth-config/config');
const sequelize = require('../../../components/sequelize');
const logger = require('../../../components/logger').getLogger('microServiceAuth');
const TIMEOUT = 1000 * 60 * 5;
const JWT_SECRET = require('../../../../config/config').jwt_secret;
const jwt = require('jsonwebtoken');
const axios = require('axios').create({
    baseURL: `http://${config.host}:${config.port}`
});
const _ = require('lodash');
const os = require('os');

class ValidationError extends Error {
    constructor(validationErrors) {
        super('ValidationError');

        this.name = 'ValidationError';
        this.validationErrors = validationErrors;
        Error.captureStackTrace(this, this.constructor);
    }
}

var AuthService = {};

/**
 * register - Description
 *
 * @param {Object} userData object contained user information
 * @param {String} userData.firstName
 * @param {String} userData.lastName
 * @param {String} userData.email
 * @param {String} userData.password
 * @param {registerCallback} cb   callback on result
 *
 * @return {type} Description
 */
AuthService.register = function(userData, cb) {

    validateUser_(userData, (err) => {
        if (err) {
            logger.critical(err);
            throw err;
        }
        var response = await (axios.post('/user', {
            firstName: _.capitalize(userData.firstName),
            lastName: _.capitalize(userData.lastName),
            email: userData.email,
            password: userData.password
        }));
        return cb(null, response.data)
    })
};

/**
 * callback used in register
 * @callback registerCallback
 * @param {Object} err error
 * @param {Object} authUser created auth user
 */


/**
 * changePassword - change password for user
 *
 * @param {Number} authUserId id of user on microservice
 * @param {String} password  password candidate
 */
AuthService.changePassword = function(authUserId, password, cb) {
    validatePassword_(password, (err) => {
        axios.put(`/user/${authUserId}`, {
                password
            })
            .then(
                res => cb(null, res),
                err => { logger.critical(err);  cb(err); }
            )
    })

};


AuthService.login = function(userData, cb) {
    var email = userData.email,
        password = userData.password;

    axios.post(`/user/${email}`, {
            password
        })
        .then(
            res => cb(null, res),
            err => { logger.critical(err);  cb(err); }
        )
};


AuthService.generateToken = function(data, options, cb) {
    //method can pass two args
    if (typeof options === 'function' && typeof cb === 'undefined') {
        cb = options;
        options = {}
    }

    jwt.sign(data, JWT_SECRET, options, (err, token) => {
        if (err) { return cb(err); }
        cb(null, token);
    });
};

AuthService.verifyToken = function(token, cb) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) { return cb(err); }
        cb(null, decoded);
    });
};

AuthService.verifyUser = function(sberUserId) {
    return await (sequelize.models.SberUser.update({
        verified: true
    }, {
        where: {
            id: sberUserId,
            verified: false
        }
    }));
};

function validateUser_(userData, cb) {
    var firstName = userData.firstName,
        lastName = userData.lastName,
        email = userData.email,
        password = userData.password,
        mailRegex = new RegExp([
            '^[a-z0-9\\u007F-\\uffff!#$%&\\\'*+\\/=?' +
            '^_`{|}~-]+(?:\\.' +
            '[a-z0-9\\u007F-\\uffff!#$%&\\\'*+\\/=?^_`{|}~-]+)*@(?:[a-z0-9]' +
            '(?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{1,}$'
        ].join(''), 'i');

    if (!email || !password || password.length < 6 || !firstName || !lastName ||
        firstName.length > 20 || lastName.length > 20 || !mailRegex.test(email)) {
        var valErrors = [];

        email ? mailRegex.test(email) ? null : valErrors.push({
            email: 'Non valid email address'
        }) : valErrors.push({
            email: 'Поле email не может быть пустым'
        });

        password ? password.length > 6 ? null : valErrors.push({
            password: 'Минимальная длина пароя 6 символов'
        }) : valErrors.push({
            password: 'Поле пароль не может быть пустым'
        });

        firstName ? firstName.length > 20 ? valErrors.push({
            fistName: 'Поле "Имя" содержит больше 20 символов'
        }) : null : valErrors.push({
            fistName: 'Поле "Имя" пустое'
        });

        lastName ? lastName.length > 20 ? valErrors.push({
            lastName: 'Поле "Фамилия" содержит больше 20 символов'
        }) : null : valErrors.push({
            lastName: 'Поле "Фамилия" пустое'
        });

        return cb(new ValidationError(valErrors))
    }

    cb(null)
}

function validatePassword_(password, cb) {
    var valErrors = []
    password ? password.length > 6 ? null : valErrors.push({
        password: 'Минимальная длина пароя 6 символов'
    }) : valErrors.push({
        password: 'Поле пароль не может быть пустым'
    });

    if (valErrors.length) { return cb(new ValidationError(valErrors)); }

    cb(null)
}

module.exports = AuthService;
