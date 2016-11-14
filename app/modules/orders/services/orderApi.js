'use strict';

// work with order
// author: dmitrii kamaev

const util  = require('util');
const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const i18n   = require('../../../components/i18n');
const orderStatus = require('../enums/orderStatus');
const orderTypes = require('../enums/orderTypes');
const createOrder = require('../Order');
const SubscriptionApi = require('../../userFund/services/subscriptionApi.js');


module.exports = class OrderApi {
    /**
     * constructor
     * @param  {[obj]} params {
     *  subscriptionId
     * }
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.subscriptionId = params.subscriptionId || null;
        this.Order      = sequelize.models.Order;
    }


    /**
     * first pay
     * @param  {[obj]} data {
            userFundSnapshot
            amount,
            userFundSubscriptionId,
            sberUserId,
            isCordova
     * }
     * @return {[obj]}
     * {
     *   "orderId": "7889f1d0-64dd-4849-9253-3263783e86ce",
     *   "formUrl": "https://3dsec.sberbank.ru/payment/merchants/aventica/payment_ru.html?mdOrder=7889f1d0-64dd-4849-9253-3263783e86ce"
     * } or
     * {
     *     "errorCode": "1",
     *     "errorMessage": "Заказ с таким номером уже обработан"
     * }
     */
    firstPay(data) {
        data = {
            userFundSubscriptionId: data.userFundSubscriptionId,
            amount: data.amount,
            userFundSnapshot: data.userFundSnapshot,
            isCordova: data.isCordova,
            clientId: data.sberUserId,
            status: orderStatus.NEW,
            type: orderTypes.FIRST,
        };
        var subscriptionId = data.userFundSubscriptionId;
        new SubscriptionApi({ subscriptionId }).createPayDate(new Date());
        return await(createOrder(data).makePayment());
    }


    /**
     * one payment per minute
     * @return {[type]}
     */
    checkOnePayPerMinute() {
        const INTERVAL = 60; // 1 minute
        var order = this.getLast();
        if (!order) { return; }
        var diffMs  = Math.abs(new Date().getTime() - new Date(order.createdAt).getTime());
        var diffSec = Math.ceil(diffMs / 1000);
        if (config.preventOrderSpamming && diffSec < INTERVAL) {
            throw new errors.HttpError(i18n.__('One order per 60 seconds'), 429);
        }
    }


    /**
     * get last order
     * @return {[obj]} [description]
     */
    getLast() {
        var subscriptionId = this.subscriptionId;
        return await(this.Order.findOne({
            where: {
                userFundSubscriptionId: subscriptionId,
                type: orderTypes.FIRST
            },
            order: [ ['updatedAt', 'DESC'] ],
        }));
    }
}

