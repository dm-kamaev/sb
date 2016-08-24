'use strict';

// recurrent monthly payments (start every day)

const logger = require('../components/logger').getLogger('monthlyPayments');
const orderService = require('../modules/orders/services/orderService.js');
const moment  = require('moment');
const log = console.log;

const NumberDays = 5; // take 5 days before now

logger.info('START: recurrent monthly payments');

(function () {
    // var dates = orderService.getListDatesBefore(NumberDays, '2016-02-29');
    // var dates = orderService.getListDatesBefore(NumberDays, '2016-03-02');
    // var dates = orderService.getListDatesBefore(NumberDays,'2016-03-29');
    // var dates = orderService.getListDatesBefore(NumberDays, '2016-03-30');
    // var dates = orderService.getListDatesBefore(NumberDays, '2016-03-31');
    var dates = orderService.getListDatesBefore(NumberDays);
    // log(dates);
    var allDates = [];
    dates.forEach(date => orderService.getMissingDays(allDates, date) );

    // log(allDates);
})();