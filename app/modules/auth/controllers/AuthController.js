'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const userService = require('../../user/services/userService');
const authService = require('../services/authService');

class AuthController extends Controller {
    /**
     * @api {post} /auth find or create user
     * @apiName find or create user
     * @apiGroup Auth
     *
     * @apiParam {String} [firstName] user fist name
     * @apiParam {String} [lastName] user last name
     * @apiParam {String} phone phone number
     *
     * @apiParamExample {json} Example request:
     * {
     *     "firstName": "max",
     *     "lastName": "rylkin"
     * }
     * @apiSuccess {Object} User created user
     *
     * @apiError (Error 422) ValidationError
     *
     * @param {Object} actionContext
     * @return {Ojbect} SberUser
     */
    actionFindOrCreateUser(actionContext) {
        var userData = actionContext.request.body,
            sessionUser = actionContext.request.user,
            phoneData = sessionUser.phone,
            firstName = userData.firstName,
            lastName = userData.lastName;

        if (!phoneData || !phoneData.verified) {
            throw new errors.HttpError('Unathorized', 403);
        }

        userData.phone = phoneData.number;

        var authUser = await(userService.findAuthUserByPhone(userData.phone));
        var sberUser;

        if (!authUser) {
            if (!firstName || !lastName ||
                firstName.length > 20 || lastName.length > 20) {
                var valErrors = [];

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

                throw new errors.ValidationError(valErrors);
            }
            authUser = await(authService.createAuthUser(userData));
        } else {
            sberUser = await(userService.findSberUserByAuthId(authUser.id));
        }

        if (!sberUser) {
            sberUser = sessionUser.authId ?
                await(userService.createSberUser(authUser.id)) : sessionUser;
            await(userService.setAuthId(sberUser.id, authUser.id));
        }

        return await(new Promise((resolve, reject) => {
            actionContext.request.login(sberUser, (err) => {
                if (err) reject(new errors.HttpError(err.message, 400));
                resolve(actionContext.request.sessionID);
            });
        }));
    };
    /**
     * @api {post} /auth/logout logout
     * @apiName logout
     * @apiGroup Auth
     *
     */
    actionLogout(actionContext) {
        return actionContext.request.logout();
    };
    /**
     * @api {get} /auth/test test
     * @apiName test
     * @apiGroup Auth
     */
    actionTest(actionContext) {
        return actionContext.request.user;
    };
    /**
     * @api {post} /auth/sms send sms
     * @apiName send sms
     * @apiGroup Auth
     *
     * @apiParamExample {json} example request:
     * {
     *    "phone": "123456789"
     * }
     *
     * @apiError (Error 400) TimerError
     */
    actionSendSMS(actionContext) {
        if (actionContext.request.user.authId) {
            throw new errors.HttpError('Already logged in', 400);
        }

        var phone = actionContext.request.body.phone,
            userId = actionContext.request.user.id,
            code = ('000' + ~~(Math.random() * 990 + 1)).slice(-3);

        try {
            await(authService.saveCode(phone, code, userId));
            await(authService.sendCode(phone, code));
            // need for debug
            return code;
            return null;
        } catch (err) {
            throw new errors.HttpError(err.message, 400);
        }
    };
    /**
     * @api {post} /auth/verify
     * @apiName verify code
     * @apiGroup Auth
     *
     * @apiParamExample {json} example request:
     * {
     *    "code": "123"
     * }
     *
     * @apiError (Error 400) wrong code
     */
    actionVerifyCode(actionContext) {
        var phone = actionContext.request.user.phone.number,
            code = actionContext.request.body.code;
        var res = await(authService.verifyCode(phone, code));
        if (!res[0]) throw new errors.HttpError('Wrong code', 400);
        return null;
    };

}

module.exports = AuthController;
