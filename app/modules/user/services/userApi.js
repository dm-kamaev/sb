'use strict';

// work with user
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const i18n   = require('../../../components/i18n');

module.exports = class UserApi {
    /**
     * constructor
     * @param  {[obj]} params {
     *    sberUserId // optional
     * }
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.sberUserId = params.sberUserId || null;

        this.SberUser   = sequelize.models.SberUser;
    }

}
