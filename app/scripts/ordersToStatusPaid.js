'use strict';

// for test (for frontend developers)
// switch status for orders (like sberbank callback)
// author: dmitrii kamaev

const logger = require('../components/logger').getLogger('main');
const orderService = require('../modules/orders/services/orderService.js');
const orderStatus = require('../modules/orders/enums/orderStatus.js');
const userFundService = require('../modules/userFund/services/userFundService');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const path = require('path');
const argv = require('yargs').argv;


async(function () {
  var sberUserId = argv.sberUserId,
      status     = argv.status,
      statuses   = getStatuses();
  if (!statuses[status]) {
    throw new Error(
      'Not valid status: "'+status+'";\n'+
      'Valid statuses: [ '+(Object.keys(statuses).join(', '))+' ]'
    );
  }

  var subscriptions = await(userFundService.getSubscriptions({ sberUserId })) || [];
  if (!subscriptions.length) {
    throw new Error(`Not found subscriptions by sberUserId: ${sberUserId}`);
  }

  var orders = orderService.update({
    userFundSubscriptionId: {
      $in: subscriptions.map(subscription => subscription.id),
    }
  },{
    status
  });
  logger.info('Success');
})();


/**
 * get hash status
 * @return {[obj]} { 'failed': FAILED, 'paid': PAID, }
 */
function getStatuses () {
  var obj = {};
  Object.keys(orderStatus).forEach(key => obj[orderStatus[key]] = key);
  return obj;
}