'use strict';

// work with table ReasonOffUserFund
// writed message: reason disable/remove UserFund
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');

module.exports = class ReasonOffUserFund {
  /**
   * constructor
   * @param  {[obj]} params {
   *    sberUserId,
   *    userFundId,
   * }
   * @return {[type]}        [description]
   */
  constructor (params) {
    this.sberUserId = params.sberUserId || null;
    this.userFundId = params.userFundId || null;

    this.ReasonOffUserFund = sequelize.models.ReasonOffUserFund;
  }


  /**
   * create record in table ReasonOffUserFund
   * @param  {[obj]} data {
   *   sberUserId,
   *   userFundId,
   *   message,  // reason for delete/dsiable userFund
   * }
   * @return {[type]}      [description]
   */
  create(params) {
    var sberUserId = this.sberUserId || params.sberUserId;
    var userFundId = this.userFundId || params.userFundId;
    return await(this.ReasonOffUserFund.create({
        sberUserId,
        userFundId,
        message:  params.message,
    }));
  }

};
