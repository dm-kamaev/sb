'use strict';

// send email to user, if fund status or subscribe has changed
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const userFundService = require('../services/userFundService');
const microService = require('../../micro/services/microService.js');
const logger = require('../../../components/logger').getLogger('main');
const mailService = require('../../auth/services/mailService.js');

const userConfig = require('../../../../config/user-config/config');
const axios = require('axios').create({
    baseURL: `http://${userConfig.host}:${userConfig.port}`
});


/**
 * send mail for action with userFund
 * @type {[type]}
 */
exports.userFund = class  {
    /**
     * constructor
     * @param  {[obj]} options {
     *    isReccurent: true || false
     * }
     * @return {[type]}         [description]
     */
    constructor (options) { this.options = options || {}; }
    /**
     * send email to author UserFund when removed his userFund
     * @param  {[array]} data [ { authId: sberUser.authId, userFundName: userFund.title }, ... ]
     * @return {[type]}
     */
    removeUserFunds(data) {
        data.map((user) => {
            user.email = microService.getUserData(user.authId).email;
            return user;
        }).forEach((user) => {
            var email = user.email,
                userFundName = user.userFundName;
            if (!email) {
                return;
            }
            var data = i18n.__(
                'Your User Fund "{{userFundName}}" removed.', {
                userFundName
            });
            this.sendEmail(email, data);
        });
    }

    /**
     * send email to author UserFund when disable his userFund
     * @param  {[array]} data [ { authId: sberUser.authId, userFundName: userFund.title }, ... ]
     * @return {[type]}
     */
    disableUserFunds(data) {
        data.map(user => {
            user.email = microService.getUserData(user.authId).email;
            return user;
        }).forEach(user => {
            var email        = user.email,
                userFundName = user.userFundName,
                reason       = user.reason;
            if (!email) { return; }
            var data = i18n.__(
                'Your User Fund "{{userFundName}}" deactivated. {{reason}}', {
                    userFundName,
                    reason
                }
            );
            this.sendEmail(email, data);
        });
    }

    /**
     * send mail: select format
     * @param  {[str]}  email
     * @param  {[obj]}  data
     * @return {[type]}
     */
    sendEmail (email, data) {
        var options = this.options;
        if (options.isReccurent === true) {
            await(mailService.sendUserRecurrentPayments(email, { data }));
        } else {
            await(mailService.sendUserRemovedUserFund(email, { data }));
        }
    }
};


/**
 * send mail for action with UserFund subscription
 * @type {[type]}
 */
exports.userFundSubscription = class {
    /**
     * constructor
     * @param  {[obj]} options {
     *    isReccurent: true || false
     * }
     * @return {[type]}         [description]
     */
    constructor (options) { this.options = options || {}; }

    /**
     * send email to the subscriber UserFund when subscription disabled
     * @param  {[array]} data [ { authId: sberUser.authId, userFundName: userFund.title }, ... ]
     * @return {[type]}
     */
    disableSubscriptions (data) {
        data.map((user) => {
            user.email = microService.getUserData(user.authId).email;
            return user;
        }).forEach((user) => {
            var email = user.email,
                userFundName = user.userFundName;
            if (!email) {
                return;
            }
            var data = i18n.__(
                'Your payments to User fund "{{userFundName}}" stopped, he was removed', {
                userFundName
            });
            this.sendEmail(email, data);
        });
    }

    /**
     * send mail: select format
     * @param  {[str]}  email
     * @param  {[obj]}  data
     * @return {[type]}
     */
    sendEmail (email, data) {
        var options = this.options;
        if (options.isReccurent === true) {
            await(mailService.sendUserRecurrentPayments(email, { data }));
        } else {
            await(mailService.sendUserDisableSubcription(email, { data }));
        }
    }
};