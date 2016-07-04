
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const userService = require('../services/userService');
const userFundService = require('../../userFund/services/userFundService');
const userView = require('../views/userView');

class UserController extends Controller {
    // TODO: maybe move this to auth module?
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


        var authUser = await(userService.findAuthUserByPhone(phone));

        if (authUser) {
            var sberUser = await(userService.findSberUserByAuthId(authUser.id));
            return userView.renderUser(authUser, sberUser);
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

        authUser = await(userService.createAuthUser(userData));
        var sberUser = await(userService.createSberUser(authUser.id));

        return userView.renderUser(authUser, sberUser);
    };
    /**
     * @api {post} /user/:id/user-fund create user-fund for this user
     * @apiName create user-fund
     * @apiGroup User
     *
     * @apiParam {String} title title name of user-fund
     * @apiParam {String} description userfund description
     *
     * @apiParamExample {json} Example Request:
     * {
     *     "title": "sample userfund",
     *     "description": "sample description",
     *     "entities": [1, 2, 3, 4],
     *     "creatorId": null
     * }
     *
     * @apiError (Error 400) HttpError user already have fund or user not found
     *
     * @param {Object} actionContext
     * @param {Integer} id
     */
    actionCreateUserFund(actionContext, id) {
        try {
            var userfundData = actionContext.request.body;
            // TODO: will be replaced by
            // userfundData.creatorId = req.session.user.id
            userfundData.creatorId = id;
            var userFund = await(userFundService.createUserFund(userfundData));
            return await(userService.addUserFund(id, userFund.id));
        } catch (err) {
            throw new errors.HttpError('Userfund exists or user not found',
                400);
        }
    };
    /**
     * @api {get} /user/:id get user
     * @apiName get user by id
     * @apiGroup User
     *
     * @apiSuccess {Object} User
     *
     * @param {Object} actionContext
     * @param {Integer} id
     */
    actionGetUserById(actionContext, id) {
        var sberUser = await(userService.findSberUserById(id));
        if (!sberUser) throw new errors.NotFoundError('User', id);
        var authUser = await(userService.findAuthUserByAuthId(sberUser.authId));
        return userView.renderUser(authUser, sberUser);
    };
};

module.exports = UserController;
