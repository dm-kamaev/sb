/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const config = require('../../../../config/config.json');
const Controller = require('nodules/controller').Controller;
// const async = require('asyncawait/async');
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const userFundService = require('../services/userFundService');
const orderService = require('../../orders/services/orderService.js');
const entityService = require('../../entity/services/entityService');
const entityView = require('../../entity/views/entityView');
const userService = require('../../user/services/userService');
const sberAcquiring = require('../../sberAcquiring/services/sberAcquiring.js');
const userFundView = require('../views/userFundView');
const log = console.log;

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
     */
     // { "amount": 210 }
    actionSetAmount(actionContext) {
        var sberUserId = actionContext.request.user.id;
        var changer = 'user';
        var userFundId = actionContext.request.user.userFund.id;
        var amount = actionContext.data.amount;
        await(
            userFundService.setAmount(sberUserId, userFundId, changer, amount)
        );
        var SberUserUserFund = await(
            userFundService.getSberUserUserFundId(sberUserId, userFundId)
        );
        var SberUserUserFundId = SberUserUserFund.dataValues.id;

        var card = await(userService.findSberUserById(sberUserId)),
            currentCardId = card.dataValues.currentCardId;
        // if user with unconfirmed payment, then do first pay
        if (!currentCardId) {
            var entities = await(userFundService.getEntities(userFundId));
            var res = orderService.getListDirectionTopicFunds(entities),
                listDirectionsTopicsFunds = res[0], listFunds = res[1];
            // log('SberUserUserFundId=', SberUserUserFundId);
            // log('orderNumber=',        orderNumber);
            log('listDirectionsTopicsFunds=', listDirectionsTopicsFunds);
            log('listFunds=', listFunds);

            var data = {
                SberUserUserFundId,
                amount,
                listDirectionsTopicsFunds,
                listFunds,
                fundInfo: entities
            };
            var resInsert = await(orderService.insertPay(data));
            var sberAcquOrderNumber = resInsert.dataValues.sberAcquOrderNumber;
            // TODO: Test error for sber acqui
            // !!! REMOVE ON PRODUCTION next line!!!
            // sberAcquOrderNumber = 13;
            var responceSberAcqu = await(sberAcquiring.firstPay({
                orderNumber: sberAcquOrderNumber,
                amount,
                returnUrl: config.hostname + '#success',
                failUrl: config.hostname + '#failed',
                language: 'ru',
                clientId: sberUserId,
                jsonParams: JSON.stringify({
                    recurringFrequency: '10',
                    recurringExpiry: '21000101'
                }),
            }));
            log('responceSberAcqu=', responceSberAcqu);
            return orderService.handlerResponceSberAcqu(
                sberAcquOrderNumber, responceSberAcqu
            );
        } else {
            return { message: 'Вы изменили сумму ежемесячного платежа.' };
        }
    }
    /**
     * @api {get} /user-fund/amount get amount
     * @apiName get current amount
     * @apiGroup UserFund
     *
     */
    actionGetCurrentAmount(actionContext) {
        var sberUserId = actionContext.request.user.id,
            userFundId = actionContext.request.user.userFund.id;
        return await(userFundService.getCurrentAmount(sberUserId, userFundId));
    };
}

module.exports = UserFundController;
