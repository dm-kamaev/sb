'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const config = require('../../../../config/auth-config/config');
const sequelize = require('../../../components/sequelize');
const UserApi     = require('../../micro/services/microService.js').UserApi;
const userService = require('../../user/services/userService');
const userFundService = require('../../userFund/services/userFundService');

const _ = require('lodash');

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
 * if not exist sberUser then create id for him
 * if user authorized on another device (example phone) and create draft userFund
 * then set the user current draft userFund (example web-page)
 * @param  {[obj]} params { email, sessionUser }
 * @return {[int]}        sberUser
 */
AuthService.checkSberUserOrSetUserFund = function (params) {
    var email = params.email, sessionUser = params.sessionUser;
    var authUser = userService.findAuthUserByEmail(email),
        sberUser = userService.findSberUserByAuthId(authUser.id);

    if (!sberUser) {
        sberUser = sessionUser || userService.createSberUser(authUser.id);
        userService.setAuthId(sberUser.id, authUser.id);
    } else if (!sberUser.userFund.enabled &&
        sessionUser &&
        userFundService.countEntities(sessionUser.userFund.id)
    ) {
        userService.setUserFund(sessionUser.userFund.id, sberUser.userFund.id);
    }
    return sberUser;
}


/**
 * changePassword - change password for user
 *
 * @param {Number} authUserId id of user on microservice
 * @param {String} password  password candidate
 */
AuthService.changePassword = function(authId, password, cb) {
    validatePassword_(password, (err) => {
        new UserApi().changePassword({ authId, password }, cb);
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

// TODO: !!! REFACTORING !!!
AuthService.validateUserData = function (userData) {
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

        return { resolve:false, message:valErrors };
    }

    return { resolve:true };
}


function validatePassword_(password, cb) {
    var valErrors = []
    password ? password.length > 6 ? null : valErrors.push({
        password: 'Минимальная длина пароля 6 символов'
    }) : valErrors.push({
        password: 'Поле пароль не может быть пустым'
    });

    if (valErrors.length) { return cb(new ValidationError(valErrors)); }

    cb(null)
}


// TODO: !!! Refactoring !!!
AuthService.validatePassword = function (password) {
    var valErrors = []
    password ? password.length > 6 ? null : valErrors.push({
        password: 'Минимальная длина пароя 6 символов'
    }) : valErrors.push({
        password: 'Поле пароль не может быть пустым'
    });

    if (valErrors.length) { return { resolve:false, message:valErrors }; }

    return { resolve:true };
}

module.exports = AuthService;
