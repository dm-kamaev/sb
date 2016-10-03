'use strict';

// recurrent monthly payments (start every day)
const technicalSupport = require('../../config/technicalSupport.json');
const logger = require('../components/logger').getLogger('monthlyPayments');
const orderService = require('../modules/orders/services/orderService.js');
const userFundService = require('../modules/userFund/services/userFundService');
const sberAcquiring = require('../modules/sberAcquiring/services/sberAcquiring');
const mailService = require('../modules/auth/services/mailService.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const path = require('path');
const argv = require('yargs').argv;

const NumberDays = 5; // take 5 days before now

logger.info('START: recurrent monthly payments');


(async(function() {
    ifFailed();

    var nowDate = argv.now ? new Date(argv.now) : undefined;

    var dates = orderService.getListDatesBefore(NumberDays, nowDate);

    var allDates = [];
    dates.forEach(date => orderService.getMissingDays(allDates, date));

    var subscriptions = userFundService.getUnhandledSubscriptions(allDates, nowDate);
    subscriptions.forEach(subscription => {
        try {
            await(orderService.makeMonthlyPayment(subscription, nowDate));
        } catch (err) {
            logger.critical(err);
        }
    });
}))();


function ifFailed() {
    process.on('uncaughtException', (err) => {
        var errorMail = 'Error: ' + err + '<p>Stack: ' + err.stack + '</p>';
        var errorLog = 'Error: ' + err + '\nStack: ' + err.stack;
        logger.critical(errorLog);
        async(() =>
            mailService.sendMailCron(
                technicalSupport.cronEmail,
                { cronName: path.basename(__filename), error: errorMail }
            )
        )();
    });
}
