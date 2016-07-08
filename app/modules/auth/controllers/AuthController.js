'use strict';

const Controller = require('nodules/controller').Controller;
const async = require('asyncawait/async');
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
     * @apiParam {String} [firstName] title name of the entity
     * @apiParam {String} [lastName] entity text decsription
     * @apiParam {String} phone phone number
     *
     * @apiParamExample {json} Example request:
     * {
     *     "firstName": "max",
     *     "lastName": "rylkin",
     *     "phone": "123456789"
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
            phone = userData.phone,
            firstName = userData.firstName,
            lastName = userData.lastName;

        // TODO: phone isAcceptedBySms check here
        var authUser = await(userService.findAuthUserByPhone(phone));
        var sessionUser = actionContext.request.user;
        var sberUser;

        if (!authUser) {
            if (!phone || !firstName || !lastName ||
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

                // TODO: verify phone is accepted by SMS
                !phone ? valErrors.push({
                    phone: 'Поле "Номер телефона" пустое'
                }) : null;

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
}

module.exports = AuthController;
