'use strict';

const await = require('asyncawait/await')
const async = require('asyncawait/async')
const sequelize = require('../../components/sequelize')
const OrderModel = sequelize.models.Order
const orderStatus = require('./enums/orderStatus')
const orderTypes = require('./enums/orderTypes')
const aqService = require('../sberAcquiring/services/sberAcquiring')
const aqConfig = require('../../../config/config-sberAcquiring')
const config = require('../../../config/config.json');
const i18n = require('../../components/i18n')
const BASEURL = `${config.hostname.replace(/\/+$/, '')}:${config.port}`;
const ACCOUNTS = {
    first: {
        userName: aqConfig.userName,
        password: aqConfig.password
    },
    recurrent: {
        userName: aqConfig.userNameSsl,
        password: aqConfig.passwordSsl
    }
}


function handleError_(response, keys, validate, handle) {
    console.log(response);
    keys.forEach(key => {
        if (!validate(response[key])) {
            var errorCode = response.errorCode,
                errorMessage = response.errorMessage
            if (handle) handle()
            throw new Error(`Failed to create order, ${errorCode}: ${errorMessage}`)
        }
    })
}

module.exports = function createOrder(data) {
    switch (data.type) {
        case orderTypes.RECURRENT:
            return new RecurrentOrder(data)
            break;
        case orderTypes.FIRST:
            return new FirstOrder(data)
            break
        default:
            throw new Error(`Unknown order type: ${data.type}`)
    }
}

class Order {
    constructor(data, opts) {
        var order = data instanceof OrderModel.Instance ? data : this.createOurOrder_(data);
        Object.assign(this, data, order.dataValues, ACCOUNTS[data.type], {
            returnUrl: `${BASEURL}/#success?app=${data.isCordova}&type=payment`,
            failUrl: `${BASEURL}/#failure?app=${data.isCordova}&type=payment`,
        })

        // this.makePayment = handlers[this.type].bind(this)
    }

    createAqOrder_() {
        try {
            var result = aqService.createAqOrder(this)
            Object.assign(this, {
                sberAcquOrderId: result.orderId,
                formUrl: result.formUrl
            });

            if (!result.orderId && !result.formUrl) {
                const ourErrorCode = '100'; // "100"(our code not sberbank) if sberbank acquiring is changed key's name in responce object
                const ourErrorMessage = i18n.__('Unknown response from Sberbank acquiring');
                var errorCode = result.errorCode || ourErrorCode,
                    errorMessage = result.errorMessage || ourErrorMessage;
                var data = {
                    sberAcquErrorCode: errorCode,
                    sberAcquErrorMessage: errorMessage,
                    status: orderStatus.EQ_ORDER_NOT_CREATED
                };
                this.updateOrder_(data)
            } else {
                this.updateOrder_({
                    status: orderStatus.WAITING_FOR_PAY,
                    sberAcquOrderId: result.orderId
                })
            }

            return result;
        } catch (err) {
            this.updateOrder_({
                status: orderStatus.EQ_ORDER_NOT_CREATED
            })
            throw err;
        }
    }

    checkStatus() {
        var result = aqService.getStatusAndGetBind(this)
        if (result.actionCode == this.actionCode) return result;
        this.updateStatus_(result.actionCode)
        this.updateOrder_({
            sberAcquOrderId: result.orderId,
            sberAcquErrorCode: result.errorCode,
            sberAcquErrorMessage: result.errorMessage,
            sberAcquActionCode: result.actionCode,
            sberAcquActionCodeDescription: result.actionCodeDescription,
            status: this.status
        })
        return result;
    }

    createOurOrder_(data) {
        Object.assign(data, {
            status: orderStatus.NEW
        })
        return await (OrderModel.create(data))
    }

    updateOrder_(data) {
        await (OrderModel.update(data, {
            where: {
                sberAcquOrderNumber: this.sberAcquOrderNumber
            }
        }))
    }

    getAqStatus_() {
        var data = Object.assign({}, {
            orderNumber: this.sberAcquOrderNumber,
            orderId: this.sberAcquOrderId,
            clientId: this.clientId
        }, ACCOUNTS[this.type])
        var result = aqService.getStatusAndGetBind(data)
        if (this.sberAcquErrorCode != result.actionCode) {
            this.updateStatus_(result.actionCode)
            Object.assign(this, {
                sberAcquOrderId: result.sberAcquOrderId,
                sberAcquErrorCode: result.errorCode,
                sberAcquErrorMessage: result.errorMessage,
                sberAcquActionCode: result.actionCode,
                sberAcquActionCodeDescription: result.actionCodeDescription
            })
            this.updateOrder_(this)
        }
    }

    updateStatus_(actionCode) {
        var status;
        switch (actionCode) {
            case 0:
                status = orderStatus.PAID
                break;
            case -100:
                status = orderStatus.WAITING_FOR_PAY
                break;
            default:
                status = orderStatus.FAILED
                break;
        }
        this.status = status;
    }

    static getOrder(where) {
        if (typeof where == 'number') where = {
            sberAcquOrderNumber: where
        }
        var sqOrder = await (OrderModel.findOne({
            where
        }))
        return new Order(sqOrder);
    }
}

class RecurrentOrder extends Order {

    makePayment() {
        return new Promise((resolve, reject) => {
            var result = this.createAqOrder_()
            handleError_(result, ['orderId', 'formUrl'], key => !!key)
            result = JSON.parse(aqService.payByBind(this))
            handleError_(result, ['error'], key => !key, () => {
                this.updateOrder_({
                    status: orderStatus.FAILED,
                    sberAcquErrorCode: result.errorCode,
                    sberAcquErrorMessage: result.errorMessage
                })
            }.bind(this))
            resolve(result)
        })
    }

    updateStatus_(actionCode) {
        var status;
        switch (actionCode) {
            case 0:
                status = orderStatus.PAID
                break;
            default:
                status = orderStatus.FAILED
                break;
        }
        this.status = status;
    }
}

class FirstOrder extends Order {
    makePayment() {
        return new Promise((resolve, reject) => {
            var result = this.createAqOrder_()
            resolve(result)
        })
    }
}
