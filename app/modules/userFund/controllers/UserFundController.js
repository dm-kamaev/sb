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
        console.log(await(orderService.getOrderWithInludes(actionContext.data.orderNumber)));
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
     * @apiParam {Number} [userFundId=user.userFund.id] id of userFund
     * @apiParam {Number} amount amount you want to pay(in kopeck)
     *
     * @apiParamExample {json} exampleReqeust:
     * {
     *   "userFundId": "1",
     *   "amount": "20000"
     * }
     */
     // { "amount": 210 }
    actionSetAmount(actionContext) {
        var sberUserId = actionContext.request.user.id,
            changer = 'user',
          // now user can only pay to own userFund
            userFundId = actionContext.data.userFundId ||
                                  actionContext.request.user.userFund.id,
            amount = actionContext.data.amount;

      // check whether userFund enabled if he is not the owner
        if (userFundId != actionContext.request.user.userFund.id) {
            var userFund = await(userFundService.getUserFund(userFundId));
            if (!userFund) throw new errors.NotFoundError('UserFund', userFundId);
            if (!userFund.enabled) throw new errors.HttpError('UserFund disabled', 400);
        }
        await(
            userFundService.setAmount(sberUserId, userFundId, changer, amount)
        );

        console.log('here1');
        var subscription = await(
            userFundService.getUserFundSubscriptionId(sberUserId, userFundId)
        );
        var userFundSubscriptionId = subscription.dataValues.id;
        console.log('here2');
        var card = await(userService.findSberUserById(sberUserId)),
            currentCardId = card.dataValues.currentCardId;
        // if user with unconfirmed payment, then do first pay
        if (!currentCardId) {
            var entities = await(userFundService.getEntities(userFundId));
            console.log('here3');
            var res = orderService.getListDirectionTopicFunds(entities),
                listDirectionsTopicsFunds = res.listDirectionsTopicsFunds,
                listFunds = res.listFunds;

            console.log('here4');
            var data = {
                userFundSubscriptionId,
                amount,
                listDirectionsTopicsFunds,
                listFunds,
                fundInfo: entities,
                status: 'new'
            };
            var resInsert = await(orderService.insertPay(data));
            var sberAcquOrderNumber = resInsert.dataValues.sberAcquOrderNumber;

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
