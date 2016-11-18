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
     *    userFundId // optional
     * }
     * @return {[type]}        [description]
     */
    constructor(params) {
        this.sberUserId = params.sberUserId || null;
        this.userFundId = params.userFundId || null;

        this.SberUser   = sequelize.models.SberUser;
    }


    /**
     * get sberUser by field
     * @return {[type]} [description]
     */
    get() {
        var sberUserId = this.sberUserId;
        return await(this.SberUser.findOne({
            where: {
                id: sberUserId
            },
        }));
    }

    getAuthId() { return this.get().authId; }

    /**
     * turnOnPopUp if user first time add topic or direction
     * turn on popUpAboutAddTopicDirection
     * @param  {[Boolean]} flag
     * @return {[type]}      [description]
     */
    turnOnPopUp(flag) {
        const id = this.sberUserId;
        if (flag) {
            await (this.SberUser.update({
                popUpAboutAddTopicDirection: true
            },{
                where: {
                    id,
                }
            }));
        }
    }
}
