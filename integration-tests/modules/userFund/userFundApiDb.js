'use strict'

const config_db = require('../../config/db.json');
const util = require('util');
const db = require('pg-promise')()(config_db);
const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../../services');
const urlService = services.url;


module.exports = class UserFundApiDb {
    /**
     * [constructor description]
     * @param  {[obj]} context
     * @return {[type]}         [description]
     */
    constructor(context) {
        this.context = context;
    }

    /**
     * delete entites from userFund
     * @return {[type]} [description]
     */
    cleanUserFund() {
        var userFundId = this.context.userFundId;
        return db.query(`DELETE FROM "UserFundEntity" WHERE "userFundId"=${userFundId}`);
    }

    /**
     * enable UserFund
     * @return {[type]}
     */
    enableUserFund () {
        var userFundId = this.context.userFundId;
        return db.query(`UPDATE "UserFund" SET enabled=true WHERE id=${userFundId}`);
    }
}