/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const util  = require('util');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const logger = require('../../../components/logger').getLogger('main');
const orderService = require('../../orders/services/orderService.js');
const entityService = require('../../entity/services/entityService.js');
const UserApi = require('../../user/services/userApi.js');
const EntityApi   = require('../../entity/services/entityApi.js');
const EntitiesApi = require('../../entity/services/entitiesApi.js');
const UserFundApi = require('../services/userFundApi.js');
const CardApi     = require('../../user/services/cardApi.js');
const OrderApi    = require('../../orders/services/orderApi.js');
const PasswordAuth = require('../../auth/services/passwordAuth.js');
const ReasonOffUserFund = require('../services/reasonOffUserFund.js');
const SubscriptionApi = require('../services/subscriptionApi.js');
const entityView = require('../../entity/views/entityView');
const userFundService = require('../services/userFundService');
const userService = require('../../user/services/userService');
const userFundView = require('../views/userFundView');
const subscriptionExtractionService =
    require('../services/subscriptionExtractionService');
const _ = require('lodash');


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
        var passwordAuth = new PasswordAuth({ ctx }),
            userFundId   = passwordAuth.getUserFund('id'),
            title        = passwordAuth.getPostData('title'),
            description  = passwordAuth.getPostData('description');
        var updatedCount = await(userFundService.updateUserFund(userFundId, {
            title,
            description,
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
     * @apiSuccessExample {json} Example response:
     * [
     *      {
     *          "id": 3,
     *           "title": "МОЙ ФОНД",
     *           "description": "lorem ipsum",
     *           "imgUrl": "entity_pics/defaultFund.png",
     *           "type": "fund"
     *       },
     *       {
     *           "id": 4,
     *           "title": "Рак",
     *           "description": "sample description",
     *           "imgUrl": "entity_pics/defaultDirection.png",
     *           "type": "topic"
     *       },
     *      {
     *          "id": 1,
     *           "title": "Рак крови",
     *           "description": "lorem ipsum",
     *           "imgUrl": "entity_pics/defaultTopic.png",
     *           "type": "direction"
     *      }
     *]
     *
     * @apiError (Error 404) NotFoundError "entity", "userfund", "type of organization" not found
     * @apiError (Error 400) HttpError relation exists
     */
    actionAddEntity(ctx, entityId) {
        var userFundId = new PasswordAuth({ ctx }).getUserFund('id'),
            entityApi  = new EntityApi({ entityId: parseInt(entityId, 10) });

        entityApi.checkExist();
        entityApi.checkType();
        const isNotFund = entityApi.isTopicOrDirection();
        var entityIds = entityApi.getNestedEntityIds();

        const userFundApi = new UserFundApi({ userFundId });
        const IsNotTD = userFundApi.hasNotTopicDirection();
        entityIds = userFundApi.filterExistRelations({ entityIds });

        var sberUserId = userFundApi.getCreatorId();
        const userApi = new UserApi({ sberUserId, userFundId });
        userApi.turnOnPopUp(isNotFund && IsNotTD);

        userFundApi.addEntities({ entityIds });

        // return entities from userFund
        var entityAfterAdd = userFundApi.getEntity();
        return userFundView.renderEntities(entityAfterAdd);
    }


    /**
     * @api {delete} /user-fund/:entityId
     * @apiName remove entity
     * @apiGroup UserFund
     * @apiSuccessExample {json} Example response:
     * [
     *      {
     *          "id": 3,
     *           "title": "МОЙ ФОНД",
     *           "description": "lorem ipsum",
     *           "imgUrl": "entity_pics/defaultFund.png",
     *           "type": "fund"
     *       },
     *       {
     *           "id": 4,
     *           "title": "Рак",
     *           "description": "sample description",
     *           "imgUrl": "entity_pics/defaultDirection.png",
     *           "type": "topic"
     *       },
     *      {
     *          "id": 1,
     *           "title": "Рак крови",
     *           "description": "lorem ipsum",
     *           "imgUrl": "entity_pics/defaultTopic.png",
     *           "type": "direction"
     *      }
     *]
     *@apiSuccessExample {json} Example response:
     *[
     *    {
     *       "message": "TRY_DELETE_USERFUND"
     *    }
     *]
     * @apiError (Error 404) NotFoundError entity or userfund not found
     * @apiError (Error 400) HttpError relation don't exists
     */
    actionRemoveEntity(ctx, entityId) {
        var passwordAuth       = new PasswordAuth({ ctx }),
            userFundId         = passwordAuth.getUserFund('id'),
            loggedIn           = passwordAuth.getLoggedIn(),
            isNotDraftUserFund = passwordAuth.isNotDraftUserFund(),
            entityApi          = new EntityApi({ entityId });

        entityApi.checkExist();
        entityApi.checkType();
        var entityIds = entityApi.getNestedEntityIds();

        var userFundApi = new UserFundApi({ userFundId });

        // auth user with confirmed userFund can't has empty userFund after delete
        if (
            loggedIn &&
            isNotDraftUserFund &&
            userFundApi.isEmptyAfterRemoveEntity({ entityIds })
        ) {
            return [{ message: 'TRY_DELETE_USERFUND' }];
        }
        entityIds = userFundApi.addEmptyDirectionsTopics({ entityIds });
        userFundApi.removeEntities({ entityIds });

        // return all entities from userFund
        var remainingEntity = userFundApi.getEntity();
        return userFundView.renderEntities(remainingEntity);
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
    actionGetEntities(ctx, id) {
        var passwordAuth = new PasswordAuth({ ctx });
        if (_.isEmpty(passwordAuth.getUser())) { return []; }
        var userFundId = passwordAuth.getUserFund('id');

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
     *   "app": true
     * }
     */
    actionSetAmount(ctx) {
        const passwordAuth = new PasswordAuth({ ctx });
        var sberUserId    = passwordAuth.getUser('id'),
            changer       = 'user',
            userFundId    = passwordAuth.getUserFundIdFromPostOrOwn(),
            amount        = passwordAuth.getPostData('amount'),
            isCordova     = passwordAuth.getPostData('app', { required: false }) || false;

        // check whether userFund enabled if he is not the owner
        // if now first pay
        // then user's userfund is always disabled, but for another userfund must enable
        const userFundApi = new UserFundApi({ sberUserId, userFundId });
        userFundApi.checkEnableIfNotOwn();
        var userFund = userFundApi.getSnapshot();

        const subscriptionApi = new SubscriptionApi({ sberUserId, userFundId });
        subscriptionApi.setAmount({ changer, amount });
        var userFundSubscriptionId = subscriptionApi.getId();

        const isActiveCard = new CardApi({ sberUserId }).isActiveCard();
        if (isActiveCard) {
            subscriptionApi.enableAndSetNewPayDate();
            return { message: i18n.__('You changed the monthly payment amount.') };
        }
        const orderApi = new OrderApi({ subscriptionId: userFundSubscriptionId });
        orderApi.checkOnePayPerMinute();

        return orderApi.firstPay({
            userFundId,
            amount,
            userFundSubscriptionId,
            isActiveCard,
            userFundSnapshot: userFund,
            sberUserId,
            isCordova
        });
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

        var subscription = new SubscriptionApi({ sberUserId, userFundId }).getSubscription();
        if (!subscription) {
            var message = i18n.__(
                'Not found the subscription for user with id: {{sberUserId}} and userFundId: {{userFundId}}', {
                    sberUserId,
                    userFundId: userFundId || 'null'
                });
            return { message };
        }
        return { enabled: subscription.enabled };
    }

    actionTestGetSubscribedUsers(actionContext) {
        var body = actionContext.request.body;
        return subscriptionExtractionService.getSubscribedUserFunds(
            body.entityIds);
    }
}

module.exports = UserFundController;
