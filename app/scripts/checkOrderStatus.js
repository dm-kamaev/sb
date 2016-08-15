'use strict';

const async = require('asyncawait/async');
const await = require('asyncawait/await');
const logger = require('../components/logger').getLogger('main');
const axios = require('axios');
const sequelize = require('../components/sequelize');

logger.info('querying orders...');
sequelize.models.Order.findAll({
    where: {
            // updatedAt: new Date() - 1000 * 60 * 60 * 24,
            // createdAt: new Date() - 1000 * 60 * 21,
        actionCode: null
    }
})
    .then(orders => {
        return Promise.all(orders.map(order => {
            return axios.get(`http://localhost:3000/callback?orderNumber=${order.orderNumber}`);
        }));
    })
    .then(response => {
        console.log('resp');
        console.log(response);
    })
    .catch(e => console.log(e));
