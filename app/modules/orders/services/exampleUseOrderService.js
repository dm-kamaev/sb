'use strict';

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const orderService = require('./orderService.js');
const log = console.log;

// async(() => { orderService.failedReccurentPayment(465, 10, 'Денег нет'); })();
async(() => {
    orderService.writeInExcel({
        payments: [
          { id: 1, payment: 1000, title: 'Fund1' },
          { id: 2, payment: 1100, title: 'Fund2' },
          { id: 3, payment: 100000, title: 'Fund3' },
          { id: 4, payment: 500000, title: 'Fund4' },
          { id: 5, payment: 79000, title: 'Fund5' },
        ],
        sumModulo: 2345
    });
})();
