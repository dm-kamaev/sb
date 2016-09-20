/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const logger = require('../../../components/logger').getLogger('main');
const orderService = require('../../orders/services/orderService.js');
const entityService = require('../../entity/services/entityService');
const entityView = require('../../entity/views/entityView');
const userFundService = require('../services/userFundService');
const userService = require('../../user/services/userService');
const userFundView = require('../views/userFundView');


class UserFundController extends Controller {
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
        delete data.enabled;
        var updatedCount = await(userFundService.updateUserFund(id, data));
        if (!updatedCount[0]) throw new errors.NotFoundError(i18n.__('UserFund'), id);
        return null;
    };

    /**
     * @api {get} /user-fund/:id get user fund
     * @apiName get user fund
     * @apiGroup UserFund
     * @apiParam {Boolean} [include] include root entities
     * @apiParam {Boolean} [nested] include nested entities
     *
     * @apiSuccess {Object} UserFund
     *
     * @apiError (Error 404) NotFoundError
     */
    actionGetUserFund(ctx, id) {
        var includes = ctx.request.query.include || false,
            nested = ctx.request.query.nested || false;
        var userFund = await(userFundService.getUserFund(id, includes, nested));
        if (!userFund) throw new errors.NotFoundError(i18n.__('UserFund'), id);
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
            if (err.message === 'Not found') {
                var ids = [id, entityId].join(' OR ');
                throw new errors.NotFoundError(i18n.__('UserFund OR Entity'), ids);
            }
            throw new errors.HttpError(i18n.__('Relation exists'), 400);
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
        if (!res) throw new errors.HttpError(i18n.__('Relation don\'t exists'), 400);
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
     * @apiParam {Number} [userFundId=user.userFund.id] id of userFund
     * @apiParam {Number} amount amount you want to pay(in kopeck)
     *
     * @apiParamExample {json} exampleReqeust:
     * {
     *   "userFundId": "1",
     *   "amount": "20000",
     *   "app": true
     * }
     */
    actionSetAmount(actionContext) {
        var sberUserId = actionContext.request.user.id,
            changer = 'user',
            ownUserFundId = actionContext.request.user.userFund.id,
            // now user can only pay to own userFund
            userFundId = actionContext.data.userFundId || ownUserFundId,
            amount = actionContext.data.amount,
            isCordova = actionContext.data.app;

        // check whether userFund enabled if he is not the owner
        // if now first pay then user's userfund is always disabled, but for another userfund
        // must enable
        userFundService.checkEnableAnotherUserFund(ownUserFundId, userFundId);
        await(
            userFundService.setAmount(sberUserId, userFundId, changer, amount)
        );

        var subscription = await(
            userFundService.getUserFundSubscriptionId(sberUserId, userFundId)
        );

        var card = await(userService.findCardBySberUserId(sberUserId));
        var params = {
            userFundId,
            amount,
            userFundSubscriptionId: subscription.dataValues.id,
            currentCardId: card.dataValues.currentCardId,
            sberUserId,
            isCordova
        };
        return orderService.firstPayOrSendMessage(params);
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


    /**
     * @api {post} /user-fund/switching-subscriptions switching subscriptions
     * @apiName switching subscriptions on UserFund
     * @apiGroup UserFund
     *
     * @apiParam {Number}  [userFundId=user.userFund.id] id of userFund
     * @apiParam {Boolean} enabled switch on or off subscriptions on UserFund
     *
     * @apiParamExample {json} exampleReqeust:
     * {
     *   "userFundId": "1",
     *   "enabled": true
     * }
     * @apiError (Error 422) ValidationError wrong type
     */
    actionSwitchingSubscriptions(actionContext) {
        var sberUserId    = actionContext.request.user.id,
            ownUserFundId = actionContext.request.user.userFund.id,
            // if don't get from the request UserFundId then this is user's UserFund
            userFundId    = actionContext.data.userFundId || ownUserFundId,
            enabled       = actionContext.data.enabled;
        if (typeof(enabled) === 'boolean') {
            var message = (enabled) ? i18n.__('Subscription included') : i18n.__('Subscription off');
            await(
                userFundService.switchSubscription(sberUserId, userFundId, { enabled })
            );
            return { message };
        } else {
            throw new errors.ValidationError({
                enabled: i18n.__('enabled must be a boolean value')
            });
        }
    }

    /**
     * @api {post} /user-fund/remove-userFund remove userFund
     * @apiName remove userFund
     * @apiGroup UserFund
     */
    actionRemoveUserFund(actionContext) {
        var sberUserId = actionContext.request.user.id,
            userFundId = actionContext.request.user.userFund.id;
        await(
            userFundService.switchSubscription(sberUserId, userFundId, {
                enabled: false
            })
        );
        await(userFundService.removeUserFund(userFundId));
        return { message: i18n.__('User Fund was removed') };
    }
}

module.exports = UserFundController;