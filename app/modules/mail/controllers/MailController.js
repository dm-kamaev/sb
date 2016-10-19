/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const errors = require('../../../components/errors');
const Controller = require('nodules/controller').Controller;
const Jwt = require('../../auth/services/jwt');
const userService = require('../../user/services/userService')
const mailingCategory = require('../enum/mailingCategory')

module.exports = class MailController extends Controller {
    /**
     * @api {post} /mail/subscription change subscriptions
     * @apiName change subscriptions
     * @apiGroup Mail
     *
     * @apiParam {String="urgent", "all"} categories subscriptions category
     */
    actionChangeSubscriptions(ctx) {
        var categories = ctx.data.categories,
            sberUserId = ctx.request.user && ctx.request.user.id;

        if (!sberUserId) throw new errors.HttpError('Unathorized', 403)
        userService.changeMailSubscription({sberUserId}, categories)
    }

    /**
     * @api {get} /mail/unsubscribe unsibscribe from notifications
     * @apiName unsubscribe
     * @apiGroup Mail
     *
     * @apiParam {String} token token with sberUserId
     */
    actionUnsubscribe(ctx) {
        var token = ctx.request.query.token;

        var verifyResult = new Jwt().verifyToken(token)
        if (!verifyResult.resolve) {
            throw new errors.HttpError(verifyResult.message, 400)
        }
        var token = verifyResult.data;

        if (token.action != 'verification') {
            //TODO: todo
        }
        var email = verifyResult.data.email;

        userService.changeMailSubscription({email}, mailingCategory.ESSENTIAL)
    }
}
