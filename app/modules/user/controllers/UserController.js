/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const userService = require('../services/userService');
const userFundService = require('../../userFund/services/userFundService');
const userView = require('../views/userView');

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
     *
     * @apiSuccess {Object} User
     *
     */
    actionGetUserById(actionContext, id) {
        var sberUser = await(userService.findSberUserById(id));
        if (!sberUser || !sberUser.authId) {
            throw new errors.NotFoundError('User', id);
        }
        var authId = sberUser.authId;
        var authUser = await(userService.findAuthUserByAuthId(authId));
        return userView.renderUser(authUser, sberUser);
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
    };
    /**
     * @api {put} /user/ update user
     * @apiName update user
     * @apiGroup User
     *
     * @apiError (Error 403) HttpError Unathorized
     *
     * @apiParamExample {json} example:
     * {
     * 		"firstName": "Max",
     * 		"lastName": "Rylkin"
     * }
     */
    actionUpdateUser(actionContext) {
        var authId = actionContext.request.user.authId,
            userData = actionContext.request.body;

        if (!authId) throw new errors.HttpError('Unathorized', 403);
        await(userService.updateAuthUser(authId, userData));
        return null;
    };
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
    actionGetUser(actionContext, id) {
        var sberUser = actionContext.request.user,
            email = actionContext.request.query.email;
        if (email) {
            var authUser = await(userService.findAuthUserByEmail(email));
            if (!authUser || authUser.email != email) {
                throw new errors.NotFoundError('User', email);
            }
        } else {
            var authId = sberUser.authId;
            var authUser = await(userService.findAuthUserByAuthId(authId));
            return userView.renderUser(authUser, sberUser);
        }
    };
};

module.exports = UserController;
