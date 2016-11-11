'use strict';

// work with user's card
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');
const i18n   = require('../../../components/i18n');
const UserApi = require('./userApi.js');

module.exports = class CardApi extends UserApi {
    /**
     * constructor
     * @param  {[obj]} params {
     *    sberUserId // optional
     * }
     * @return {[type]}        [description]
     */
    constructor(params) {
        super(params);
        this.Card = sequelize.models.Card;
    }

    /**
     * get card by sberUserId
     * @return {[type]} [description]
     */
    get(){
        var sberUserId = this.sberUserId;
        var self = this;
        return await(self.SberUser.findOne({
            where: {
                id: sberUserId
            },
            include: {
                model: self.Card,
                as: 'currentCard',
                required: false
            }
        }));
    }


    /**
     * isActiveCard
     * @return {Boolean}
     */
    isActiveCard() {
        var card = this.get();
        return !!card.currentCard;
    }

};
