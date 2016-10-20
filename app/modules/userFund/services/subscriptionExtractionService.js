'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
const logger = require('../../../components/logger').getLogger('main');

var extractionService = {};

/**
 * get array of userfunds, subscribed to one+ of presented entities
 * @param {array} entityIds array of id of entities
 * @return {array} userFundIds array of id of user funds
 */
extractionService.getSubscribedUserFunds = function(entityIds) {
    var userFundIds = await(sequelize.sequelize.query(`
        SELECT DISTINCT "UserFundEntity"."userFundId"
        FROM "UserFundEntity"
        WHERE "UserFundEntity"."entityId" IN (:entityIds)`, {
            type: sequelize.sequelize.QueryTypes.SELECT,
            replacements: {
                entityIds
            }
        }));
    return userFundIds.map(id => id.userFundId);
}

module.exports = extractionService;
