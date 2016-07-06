'use strict';

const Controller = require('nodules/controller').Controller;
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const userService = require('../../user/services/userService');
const authService = require('../services/authService');

class AuthController extends Controller {
    /**
     * @api {post} /user find or create user
     * @apiName find or create user
     * @apiGroup User
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

        //TODO: phone isAcceptedBySms check here
        var authUser = await(userService.findAuthUserByPhone(phone));

        if (authUser) {
            var sberUser = await(userService.findSberUserByAuthId(authUser.id));
            if (!sberUser) {
                sberUser = await(userService.createSberUser(authUser.id));
            }
            return await(actionContext.request.login(authUser, (err) => {
                if (err) throw new errors.HttpError(err.message, 400);
                return actionContext.response.redirect(`/user/${sberUser.id}`);
            }));
        }

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
        var sberUser = await(userService.createSberUser(authUser.id));
        actionContext.request.login(authUser, (err) => {
            if (err) throw new errors.HttpError(err.message, 400);
            return actionContext.response.redirect(`/user/${sberUser.id}`);
        });
    };

    actionLogout(actionContext) {
        return actionContext.request.logout();
    }
}

module.exports = AuthController;
