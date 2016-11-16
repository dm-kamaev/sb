'use strict';

// work with users
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const i18n   = require('../../../components/i18n');

module.exports = class UsersApi {
    /**
     * constructor
     * @param  {[obj]} params {
     *    sberUserIds // optional
     * }
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.sberUserIds = params.sberUserIds || null;

        this.SberUser   = sequelize.models.SberUser;
    }


    /**
     * get sberUsers by field
     * @return {[type]} [description]
     */
    get() {
        var sberUserIds = this.sberUserIds;
        return await(this.SberUser.findAll({
            where: {
                id: {
                    $in:sberUserIds
                }
            },
        })) || [];
    }
}
