'use strict';

const Controller = require('nodules/controller').Controller;
const statementService = require('../services/statementService');
const await = require('asyncawait/await');

module.exports = class StatementController extends Controller {
    actionUploadStatement(ctx) {
        var file = ctx.request.file.buffer.toString();
        console.log(statementService.parseStatement(file))
    }
}