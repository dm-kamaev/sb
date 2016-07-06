'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const userService = require('../services/userService');
const userFundService = require('../../userFund/services/userFundService');
const userView = require('../views/userView');

class UserController extends Controller {
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
    actionCreateUserFund(actionContext) {
        if (!actionContext.request.isAuthenticated()){
          throw new errors.HttpError('Unathorized', 401);
        }

        try {
            var userfundData = actionContext.request.body;
            userfundData.creatorId = actionContext.request.user.sberId;
            var userFund = await(userFundService.createUserFund(userfundData));
            return await(userService.addUserFund(userfundData.creatorId, userFund.id));
        } catch (err) {
            throw new errors.HttpError('Userfund exists or user not found',400);
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
