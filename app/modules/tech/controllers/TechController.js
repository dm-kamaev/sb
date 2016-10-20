'use strict';

const Controller = require('nodules/controller').Controller;
const errors = require('../../../components/errors');
const util  = require('util');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const versionConfig = require('../../../../config/version.json');

module.exports = class TechController extends Controller {
    /**
     * @api {get} /tech/version
     * @apiName get current api version
     * @apiGroup Tech
     */
    actionGetCurrentVersion(actionContext) {
        //TODO: auto version management
        return {
            version: versionConfig.version
        };
    }
};
