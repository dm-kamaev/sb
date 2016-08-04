'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const userFundService = require('../services/userFundService');
const entityService = require('../../entity/services/entityService');
const userFundView = require('../views/userFundView');
const entityView = require('../../entity/views/entityView');

class UserFundController extends Controller {
    /**
     * @api {post} /user-fund create user fund
     * @apiName create user fund
     * @apiGroup UserFund
     *
     * @apiParam {String} title title name
     * @apiParam {String} description text
     * @apiParam {Integer[]} entities array of entity id's related to userfund
     * @apiParam {Integer} ownerId user created this userfund
     *
     * @apiParamExample {json} Example Request:
     * {
     *     "title": "sample userfund",
     *     "description": "sample description",
     *     "entities": [1, 2, 3, 4],
     *     "creatorId": null
     * }
     *
     * @apiSuccess {Object} UserFund created userfund
     *
     * @apiError (Error 404) NotFoundError entities or ownerId not found
     */
    actionCreateUserFund(actionContext) {
        var data = actionContext.request.body;
        // TODO: implement
        // data.ownerId = actionContext.request.session.user.id;
        data.creatorId = null;
        var userFund = await(userFundService.createUserFund(data));
        actionContext.response.statusCode = 201;
        actionContext.response.set('Location', `/user-fund/${userFund.id}`);
        return userFundView.renderUserFund(userFund);
    };

    /**
     * @api {delete} /user-fund/:id delete user fund
     * @apiName delete user fund
     * @apiGroup UserFund
     *
     */
    actionDeleteUserFund(actionContext, id) {
        var deletedCount = await(userFundService.deleteUserFund(id));
        if (!deletedCount) throw new errors.NotFoundError('UserFund', id);
        return null;
    };

    /**
     * @api {put} /user-fund/:id update userFund
     * @apiName update userfund
     * @apiGroup UserFund
     *
     * @apiParamExample {json} Example request:
     * {
     *     "title": "title123",
     *     "description": "sample description"
     * }
     *
     *
     * @apiError (Error 404) NotFoundError user fund not found
     */
    actionUpdateUserFund(actionContext, id) {
        var data = actionContext.request.body;
        delete data.id;
        var updatedCount = await(userFundService.updateUserFund(id, data));
        if (!updatedCount[0]) throw new errors.NotFoundError('UserFund', id);
        return null;
    };

    /**
     * @api {get} /user-fund/:id get user fund
     * @apiName get user fund
     * @apiGroup UserFund
     *
     * @apiSuccess {Object} UserFund
     *
     * @apiError (Error 404) NotFoundError
     */
    actionGetUserFund(actionContext, id) {
        var userFund = await(userFundService.getUserFund(id));
        if (!userFund) throw new errors.NotFoundError('UserFund', id);
        return userFundView.renderUserFund(userFund);
    };

    /**
     * @api {get} /user-fund/ get userFunds
     * @apiName get userFunds
     * @apiGroup UserFund
     *
     * @apiSuccess {Object[]} UserFunds
     */
    actionGetUserFunds(actionContext) {
        var userFunds = await(userFundService.getUserFunds());
        return userFundView.renderUserFunds(userFunds);
    };

    /**
     * @api {get} /user-fund/today fresh funds
     * @apiName get today created userfunds
     * @apiGroup UserFund
     *
     * @apiSuccess {Object[]} UserFunds
     */
    actionGetTodayUserFundsCount(actionContext) {
        var count = await(userFundService.getTodayCreatedUserFunds());
        return {
            count
        };
    };

    /**
     * @api {post} /user-fund/:entityId add entity
     * @apiName add entity
     * @apiGroup UserFund
     *
     *
     * @apiError (Error 404) NotFoundError entity or userfund not found
     * @apiError (Error 400) HttpError relation exists
     */
    actionAddEntity(actionContext, entityId) {
        var id = actionContext.request.user.userFund.id;
        try {
            await(userFundService.addEntity(id, entityId));
            return null;
        } catch (err) {
            if (err.message == 'Not found') {
                var ids = [id, entityId].join(' OR ');
                throw new errors.NotFoundError('UserFund OR Entity', ids);
            }
            throw new errors.HttpError('RelationExists', 400);
        }
    };

    /**
     * @api {delete} /user-fund/:entityId
     * @apiName removeEntity
     * @apiGroup UserFund
     *
     *
     * @apiError (Error 404) NotFoundError entity or userfund not found
     * @apiError (Error 400) HttpError relation don't exists
     */
    actionRemoveEntity(actionContext, entityId) {
        var id = actionContext.request.user.userFund.id;
        var res = await(userFundService.removeEntity(id, entityId));
        if (!res) throw new errors.HttpError('Relation don\'t exists', 400);
        return null;
    };

    /**
     * @api {get} /user-fund/entity get entities
     * @apiName get entities associated with this userfund
     * @apiGroup UserFund
     *
     * @apiSuccess {Object[]} entities
     *
     * @apiError (Error 404) NotFoundError userfund not found
     */
    actionGetEntities(actionContext, id) {
        var userFundId = actionContext.request.user.userFund.id;
        var entities = await(userFundService.getEntities(userFundId));
        return entityView.renderEntities(entities);
    };
    /**
     * @api {get} /user-fund/count get today and all count
     * @apiName count
     * @apiGroup UserFund
     *
     * @apiSuccess {Object} today and all count
     *
     * @param  {[type]} actionContext [description]
     * @param  {[type]} id            [description]
     * @return {[type]}               [description]
     */
    actionCountUserFunds(actionContext, id) {
        var all = await(entityService.getFundsCount());
        var today = await(entityService.getTodayFundsCount());
        return {
            all,
            today
        };
    };
    /**
     * @api {post} /user-fund/amount set amount
     * @apiName set amount
     * @apiGroup UserFund
     *
     * @param  {[type]} actionContext [description]
     * @return {[type]}               [description]
     */
    actionSetAmount(actionContext) {
        var sberUserId = actionContext.request.user.id,
            changer = 'user',
            userFundId = actionContext.request.user.userFund.id,
            amount = actionContext.data.amount;
        return await(userFundService.setAmount(sberUserId, userFundId, changer, amount));
    };
    /**
     * @api {get} /user-fund/amount get amount
     * @apiName get current amount
     * @apiGroup UserFund
     *
     * @param  {[type]} actionContext [description]
     * @return {[type]}               [description]
     */
    actionGetCurrentAmount(actionContext) {
        var sberUserId = actionContext.request.user.id,
            userFundId = actionContext.request.user.userFund.id;
        return await(userFundService.getCurrentAmount(sberUserId, userFundId));
    };
}

module.exports = UserFundController;
