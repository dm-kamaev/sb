/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const util = require('util');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const userService = require('../services/userService');
const userFundService = require('../../userFund/services/userFundService');
const userView = require('../views/userView');
const orderStatus = require('../../orders/enums/orderStatus');

class UserController extends Controller {
    /**
     * @api {post} /user/user-fund enable user-fund for this user(test)
     * @apiName create user-fund
     * @apiGroup User
     *
     * @apiParam {String} title title name of user-fund
     * @apiParam {String} description userfund description
     *
     * @apiError (Error 400) HttpError user already have fund or user not found
     *
     */
    actionCreateUserFund(actionContext) {
        var id = actionContext.request.user.userFund.id;
        var res = await(userFundService.toggleEnabled(id, true));
        if (!res[0]) throw new errors.HttpError('Userfund exists', 400);
    };
    /**
     * @api {get} /user/:id get user by id
     * @apiName get user by id
     * @apiGroup User
     * @apiHeader (AdminToken) {String} Token-Header Authorization value
     *
     * @apiSuccess {Object} User
     *
     */
    actionGetUserById(actionContext, id) {
        var sberUser = await(userService.findSberUserById(id, true));
        if (!sberUser || !sberUser.authId) {
            throw new errors.NotFoundError('User', id);
        }
        var authId = sberUser.authId;
        var authUser = await(userService.findAuthUserByAuthId(authId));
        var renderedUser = userView.renderUser(authUser, sberUser);
        renderUser.loggedIn = undefined;
        return renderedUser;
    };
    /**
     * @api {delete} /user/user-fund disable user-fund
     * @apiName deleted user-fund
     * @apiGroup User
     *
     * @apiError (Error 404) NotFoundError Userfund don't exists
     */
    actionDeleteUserFund(actionContext) {
        var id = actionContext.request.user.userFund.id;
        var res = await(userFundService.toggleEnabled(id, false));
        if (!res[0]) throw new errors.NotFoundError('Userfund', id);
    }


    /**
     * @api {put} /user/ update user
     * @apiName update user
     * @apiGroup User
     *
     * @apiError (Error 403) HttpError Unathorized
     *
     * @apiParamExample {json} example:
     * {
     *     "firstName": "Vasya",
     *     "lastName": "Ivanov",
     *     "email":    "vasya-ivanov@mail.ru"
     * }
     */
    actionUpdateUser(actionContext) {
        var request = actionContext.request,
            user = request.user || {};
        var authId = user.authId || null,
            userData = request.body || {};
        if (!authId) throw new errors.HttpError('Unathorized', 403);

        try {
            await(userService.updateAuthUser(authId, userData));
            return null;
        } catch (error) {
            if (error.data) { throw new errors.ValidationError(error.data); }
            throw new errors.HttpError(util.inspect(error, { depth: 4 }), 503);
        }
    }


    /**
     * @api {get} /user get user
     * @apiName get current user
     * @apiGroup User
     *
     * @apiSuccessExample {json} Example response:
     * {
     * 		 "id": 11,
     *     "phone": "00",
     *     "firstName": "Max",
     *     "lastName": "Rylkin",
     *     "userFund": {
     *     		"id": 11,
     *       	"title": null,
     *        "description": null,
     *        "enabled": true,
     *        "creatorId": 11,
     *        "createdAt": "2016-07-15T11:57:13.909Z",
     *        "updatedAt": "2016-07-15T11:57:13.909Z"
     *     },
     *     "loggedIn": true
     * }
     */
    actionFindUser(actionContext) {
        var sberUser = actionContext.request.user,
            email = actionContext.request.query.email
                    && actionContext.request.query.email.toLowerCase()
        if (email) {
            var authUser = await(userService.findAuthUserByEmail(email));
            if (!authUser || authUser.email != email) {
                throw new errors.NotFoundError('User', email);
            }
        } else {
            if (!sberUser) return null;
            var authId = sberUser.authId;
            var authUser = await(userService.findAuthUserByAuthId(authId));
            return userView.renderUser(authUser, sberUser);
        }
    };

    /**
     * @api {get} /user/all get all users
     * @apiName Get all users
     * @apiGroup User
     * @apiHeader (AdminToken) {String} Token-Header Authorization value
     * @apiHeaderExample {json} Header-Example:
     *    {
     *      "Token-Header": "superSecretTokenString"
     *    }
     */
    actionGetUsers(ctx) {
        var sberUsers = userService.getSberUsers(),
            ids = sberUsers.map(sberUser => sberUser.authId).join(','),
            authUsers = userService.getAuthUsersByIds(ids);

        return sberUsers.map(sberUser => {
            var authUser = authUsers.find(authUser => authUser.id == sberUser.authId);
            var renderedUser = userView.renderUser(authUser, sberUser);
            renderUser.loggedIn = undefined;
            renderedUser.userFund = undefined;
            return renderedUser;
        });
    }

    /**
     * @api {get} /user/:id/order get orders
     * @apiName Get orders
     * @apiGroup User
     * @apiHeader (AdminToken) {String} Token-Header Authorization value
     * @apiHeaderExample {json} Header-Example:
     *    {
     *      "Token-Header": "superSecretTokenString"
     *    }
     */
    actionGetOrders(ctx, id) {
        var currentStatus;
        if (ctx.request.isAdmin) {
            currentStatus = Object.keys(orderStatus)
                                  .map(status => orderStatus[status])
        } else {
            currentStatus = [orderStatus.PAID, orderStatus.WAITING_FOR_PAY]
        }
        return userService.getOrders(id, currentStatus);
    }

    /**
     * @api {put} /user/:id update user
     * @apiName update user
     * @apiGroup User
     * @apiHeader (AdminToken) {String} Token-Header Authorization value
     * @apiHeaderExample {json} Header-Example:
     *    {
     *      "Token-Header": "superSecretTokenString"
     *    }
     */
    actionUpdateUserById(ctx, id) {
        var sberUser = userService.findSberUserById(id);
        try {
            var authUser = userService.updateAuthUser(sberUser.authId, ctx.data);
        } catch (err) {
            if (err.data && err.data[0].code == 'ValidationError') {
                throw new errors.ValidationError(err.data[0].validationErrors);
            }
            throw err;
        }
        return userView.renderUser(authUser, sberUser);
    }

    /**
     * @api {get} /user/:id/subscription get subscriptions
     * @apiName get subscriptions
     * @apiGroup User
     * @apiHeader (AdminToken) {String} Token-Header Authorization value
     * @apiHeaderExample {json} Header-Example:
     *    {
     *      "Token-Header": "superSecretTokenString"
     *    }
     */
    actionGetSubscriptions(ctx, id) {
        return userService.getUserFundSubscriptions(id);
    }

    /**
     * @api {post} /user/:id/subscription/:subscriptionId change amount
     * @apiName change amount
     * @apiGroup User
     * @apiHeader (AdminToken) {String} Token-Header Authorization value
     * @apiParam {Number} amount amount in kopeck
     * @apiSampleRequest http://www58.lan:3000/user/1/subscription/2/amount
     * @apiHeaderExample {json} Header-Example:
     *    {
     *      "Token-Header": "superSecretTokenString"
     *    }
     */
    actionChangeAmount(ctx, id, subscriptionId) {
        var amount = ctx.data.amount;
        return userFundService.changeAmount(id, subscriptionId, 'admin', amount);
    }
};

module.exports = UserController;
