'use strict';

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const orderService = require('./orderService.js');

async(() => {
    orderService.failedReccurentPayment(465, 10, 'Денег нет');
})();