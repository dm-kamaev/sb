'use strict';

// recurrent monthly payments (start every day)
const technicalSupport = require('../../config/technicalSupport.json');
const logger = require('../components/logger').getLogger('monthlyPayments');
const orderService = require('../modules/orders/services/orderService.js');
const userFundService = require('../modules/userFund/services/userFundService');
const sberAcquiring = require('../modules/sberAcquiring/services/sberAcquiring')
const mailService = require('../modules/auth/services/mailService.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const path = require('path');
const log = console.log;

const NumberDays = 5; // take 5 days before now

logger.info('START: recurrent monthly payments');


(async(function () {
    ifFailed();
    // null.lenght;
    // var dates = orderService.getListDatesBefore(NumberDays, '2016-02-29');
    // var dates = orderService.getListDatesBefore(NumberDays, '2016-03-02');
    // var dates = orderService.getListDatesBefore(NumberDays,'2016-03-29');
    // var dates = orderService.getListDatesBefore(NumberDays, '2016-03-30');
    // var dates = orderService.getListDatesBefore(NumberDays, '2016-03-31');
    var dates = orderService.getListDatesBefore(NumberDays);
    // log(dates);
    var allDates = [];
    dates.forEach(date => orderService.getMissingDays(allDates, date) );
    // console.log(allDates);
    var subscriptions = userFundService.getUnhandledSubscriptions(allDates);
    // var order = orderService.createOrder

    console.log(subscriptions);
    subscriptions.forEach(subscription => {
        await(orderService.makeMonthlyPayment(subscription))
    })
}))();


function ifFailed() {
    process.on('uncaughtException', (err) => {
        var errorMail = 'Error: '+err+'<p>Stack: ' + err.stack+'</p>';
        var errorLog = 'Error: '+err+'\nStack: ' + err.stack;
        logger.critical(errorLog);
        async(() =>
            mailService.sendMailCron(
                technicalSupport.cronEmail,
                { cronName: path.basename(__filename), error: errorMail }
            )
        )();
    });
}
