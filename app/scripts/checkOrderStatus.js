'use strict';

const logger = require('../components/logger').getLogger('main');
const axios = require('axios');
const sequelize = require('../components/sequelize');

logger.info('querying orders...');
sequelize.models.Order.findAll({
    where: {
        createdAt: {
            $lt: new Date() - 1000 * 60 * 21
        },
        sberAcquActionCode: null,
        status: 'waitingForPay'
    }
})
    .then(orders => {
        return Promise.all(orders.map(order => {
            return axios.get(`http://localhost:3000/callback?orderNumber=${order.sberAcquOrderNumber}`);
        }));
    })
    .catch(e => logger.critical(e));
