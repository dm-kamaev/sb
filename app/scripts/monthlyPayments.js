'use strict';

// recurrent monthly payments (start every day)

const logger = require('../components/logger').getLogger('monthlyPayments');
const axios  = require('axios');
const moment  = require('moment');
const sequelize = require('../components/sequelize');

// console.log(moment('2016-02-29').endOf('month').format('YYYY-MM-DD'));
logger.info('recurrent monthly payments...');

getListDates();
function getListDates () {
    var res = [];
    // var now = moment('2016-02-29');
    var now = moment('2016-02-29');
    var lastDayMonth = moment('2016-02-29').endOf('month'),
        // formatLastDayMonth = lastDayMonth.format('YYYY-MM-DD');
        formatLastDayMonth = lastDayMonth.format('DD');
    // res.push(now.format('YYYY-MM-DD'));
    res.push(now.format('DD'));


    for (var i = 0; i < 5; i++) {
      now = now.subtract(1, 'day');
      res.push(now.format('DD'));
      // res.push(now.format('YYYY-MM-DD'));
    }

    for (var j = 0, l1 = res.length; j < l1; j++) {
      // console.log(res[j], formatLastDayMonth);
      if (formatLastDayMonth === res[j]) {
        res = res.concat(getMissingDays(formatLastDayMonth));
      }
    }
    console.log(res);
}


function getMissingDays (formatLastDayMonth) {
    var digitLastDay = parseInt(formatLastDayMonth, 10),
        diff = 31 - digitLastDay,
        res = [];
    if (diff) {
        for (var i = 1; i <= diff; i++) {
          res.push(digitLastDay+i);
        }
    }
    return res;
}

