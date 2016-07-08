'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const userService = require('../services/userService');
const userFundService = require('../../userFund/services/userFundService');
const userView = require('../views/userView');

class UserController extends Controller {
    /**
     * @api {post} /user/user-fund create user-fund for this user
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
        var id = actionContext.request.user.userFund.id;
        var res = await(userFundService.toggleDraft(id, false));
        if (!res[0]) throw new errors.HttpError('Userfund exists', 400);
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
        if (!sberUser || !sberUser.authId) {
            throw new errors.NotFoundError('User', id);
        }
        var authUser = await(userService.findAuthUserByAuthId(sberUser.authId));
        return userView.renderUser(authUser, sberUser);
    };
    /**
     * @api {delete} /user/user-fund delete user-fund
     * @apiName deleted user-fund
     * @apiGroup User
     *
     * @apiError (Error 404) NotFoundError Userfund don't exists
     */
    actionDeleteUserFund(actionContext) {
        var id = actionContext.request.user.userFund.id;
        var res = await(userFundService.toggleDraft(id, true));
        if (!res[0]) throw new errors.NotFoundError('Userfund', id);
    };
};

module.exports = UserController;
