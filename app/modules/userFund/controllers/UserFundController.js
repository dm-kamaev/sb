/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const logger = require('../../../components/logger').getLogger('main');
const orderService = require('../../orders/services/orderService.js');
const entityService = require('../../entity/services/entityService');
const entityView = require('../../entity/views/entityView');
const userFundService = require('../services/userFundService');
const sendMail = require('../services/sendMail.js');
const userService = require('../../user/services/userService');
const userFundView = require('../views/userFundView');
const ReasonOffUserFund = require('../services/reasonOffUserFund.js');


class UserFundController extends Controller {
    /**
     * @api {put} /user-fund/ update userFund
     * @apiName update userfund
     * @apiGroup UserFund
     *
     * @apiParamExample {json} Example request:
     * {
     *     "title": "title123",
     *     "description": "sample description"
     * }
     *
     * @apiError (Error 404) NotFoundError user fund not found
     */
    actionUpdateUserFund(ctx) {
        var request = ctx.request  || {},
            user    = request.user || {},
            data    = request.body || {};
        var userFund   = user.userFund || {},
            userFundId = userFund.id || null;
        if (!userFundId) { throw new errors.NotFoundError(i18n.__('UserFund'), userFundId); }
        var updatedCount = await(userFundService.updateUserFund(userFundId, {
            title: data.title || '',
            description: data.description || '',
        }));
        if (!updatedCount[0]) { throw new errors.NotFoundError(i18n.__('UserFund'), userFundId); }
        return null;
    }

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
        var userFund = userFundService.getUserFund(id, includes, nested);
        if (!userFund) { throw new errors.NotFoundError(i18n.__('UserFund'), id); }
        return userFundView.renderUserFund(userFund);
    }

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
    }

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
        var request = actionContext.request;
        var userFundId = (request.user.userFund) ? request.user.userFund.id : null;
        try {
            await(userFundService.addEntity(userFundId, entityId));
            return null;
        } catch (err) {
            if (err.message === 'Not found') {
                var ids = [ userFundId, entityId ].join(' OR ');
                throw new errors.NotFoundError(i18n.__('UserFund OR Entity'), ids);
            }
            throw new errors.HttpError(i18n.__('Relation exists'), 400);
        }
    }

    /**
     * @api {delete} /user-fund/:entityId
     * @apiName remove Entity
     * @apiGroup UserFund
     *
     *
     * @apiError (Error 404) NotFoundError entity or userfund not found
     * @apiError (Error 400) HttpError relation don't exists
     */
    actionRemoveEntity(actionContext, entityId) {
        var id = actionContext.request.user.userFund.id;
        var res = await(userFundService.removeEntity(id, entityId));
        if (!res[0]) {
          throw new errors.HttpError(i18n.__('Relation don\'t exists'), 400);
        }
        return null;
    }

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
        var renderedEntities = entityView.renderEntities(entities);
        return renderedEntities.map(entity => Object.assign(entity, {
            checked: true
        }));
    }


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
    }


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
     *   "app": true,
     *   "percent": null,
     *   "salary":  null
     * }
     */
    actionSetAmount(actionContext) {
        var request = actionContext.request,
            user = request.user || {};
        var sberUserId = user.id || null,
            changer = 'user',
            ownUserFundId = (user.userFund) ? user.userFund.id : null,
            data = actionContext.data || {},
            // now user can only pay to own userFund
            userFundId = data.userFundId || ownUserFundId,
            amount = data.amount || null,
            isCordova = data.app,
            // null –– current amount, integer –– a percentage of your salary
            percent = data.percent || null,
            // null –– current amount, integer –– salary per month in cents
            salary = data.salary || null;

        if (!sberUserId) { throw new errors.NotFoundError(i18n.__('SberUser'), sberUserId); }
        if (!ownUserFundId) { throw new errors.NotFoundError(i18n.__('UserFund'), ownUserFundId); }
        // check whether userFund enabled if he is not the owner
        // if now first pay then user's userfund is always disabled, but for another userfund
        // must enable
        userFundService.checkEnableAnotherUserFund(ownUserFundId, userFundId);
        await(
            userFundService.setAmount({
                sberUserId, userFundId, changer, amount, percent, salary
            })
        );

        var subscription = await(
            userFundService.getUserFundSubscriptionId(sberUserId, userFundId)
        );

        var card = await(userService.findCardBySberUserId(sberUserId));
        var isActiveCard = (card.currentCard) ? true : false;
        var params = {
            userFundId,
            amount,
            userFundSubscriptionId: subscription.id,
            isActiveCard,
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
    }


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
        var sberUserId = actionContext.request.user.id,
            ownUserFundId = actionContext.request.user.userFund.id,
            // if don't get from the request UserFundId then this is user's UserFund
            userFundId = actionContext.data.userFundId || ownUserFundId,
            enabled = actionContext.data.enabled;
        if (typeof (enabled) === 'boolean') {
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
     * @apiParamExample {json} example:
     * {
     *     "message": "Не хочу больше платить"
     * }
     * @apiSuccessExample {json} Example response:
     * {
     *     "message": "Юзер фонд был удален"
     * }
     */
    actionRemoveUserFund(ctx) {
        var request    = ctx.request  || {},
            user       = request.user || {},
            message    = (ctx.data) ? ctx.data.message : '',
            sberUserId = user.id || null,
            userFundId = (user.userFund) ? user.userFund.id : null;

        await(new ReasonOffUserFund({ sberUserId, userFundId }).create({ message }));
        var userFund = await(userFundService.getUserFund(userFundId)) || {};
        var sberUser = userService.findSberUserById(sberUserId) || {};

        // removed UF, card and send email owner
        await(userFundService.removeUserFund(userFundId));
        await(userService.removeCard(sberUserId));
        new sendMail.userFund().removeUserFunds([
            { authId: sberUser.authId, userFundName: userFund.title },
        ]);

        // disable subcriptions on UF, send email to subscribers
        var subscriptions = userFundService.getSubscriptions({ userFundId }) || [];
        var sberUserIds = subscriptions.map(subscription => subscription.SberUserId);
        var sberUsers = await(userService.getSberUsers({
            id: {
                $in: sberUserIds,
            }
        })) || [];
        var dataForMail = sberUsers.map(sberUser => {
            return { authId: sberUser.authId, userFundName: userFund.title };
        });

        await(userFundService.updateSubscriptions(
            { userFundId },
            { enabled: false }
        ));
        new sendMail.userFundSubscription().disableSubscriptions(dataForMail);

        // create new empty userFund for user, because frontend could add/edit
        // funds in userFund
        await(userFundService.createUserFund({
            title: '',
            description: '',
            creatorId: sberUserId,
            enabled: false
        }));

        return { message: i18n.__('User Fund was removed') };
    }


    /**
     * @api {get} /user-fund/get-status-subscription-userFund/:id get status of subscription to userFund
     * @apiName get status of subscription to userFund
     * @apiGroup UserFund
     *
     * @apiSuccessExample {json} Example response:
     * {
     *     enabled: true || false
     * }
     */
    actionGetStatusSubscriptionUserFund(actionContext, id) {
        var request = actionContext.request,
            sberUserId = request.user.id,
            ownUserFundId = (request.user.userFund) ? request.user.userFund.id : null,
            // if don't get from the request UserFundId, then this is user's UserFund
            userFundId = id || ownUserFundId;

        var res = await(userFundService.getUserFundSubscriptionId(sberUserId, userFundId));
        if (!res) {
            var message = i18n.__(
                'Not found the subscription for user with id: {{sberUserId}} and userFundId: {{userFundId}}', {
                    sberUserId,
                    userFundId: userFundId || 'null'
                });
            return { message };
        }
        return { enabled: res.enabled };
    }
}

module.exports = UserFundController;
