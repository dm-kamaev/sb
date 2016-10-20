'use strict';

const Controller = require('nodules/controller').Controller;
const statementService = require('../services/statementService.js');
const statementView    = require('../views/statementView.js');
const errors = require('../../../components/errors');
const util  = require('util');
const await = require('asyncawait/await');
const async = require('asyncawait/async');

module.exports = class StatementController extends Controller {
    /**
     * @api {post} /statement/upload upload statement
     * @apiName upload statement
     * @apiGroup Statement
     *
     * @apiParam {Object} dateStart start of statement
     * @apiParam {Object} dateEnd end of statement
     * @apiParam {Object} statement statement file
     */
    actionUploadStatement(ctx) {
        var file = ctx.request.file && ctx.request.file.buffer.toString(),
            dateStart = ctx.data.dateStart,
            dateEnd = ctx.data.dateEnd;

        if (!file || !dateStart || !dateEnd) {
            throw new errors.HttpError('Wrong request', 400);
        }

        var bankOrders = statementService.parseStatement(file);

        var statement = {
            dateStart,
            dateEnd,
            fileName: ctx.request.file.originalname,
            bankOrders: [
                {
                    sberAcquOrderNumber: 35701,
                    chargeDate: new Date(),
                    amount: 123123
                }
            ]
        };

        var result = statementService.handleStatement(statement);
        if (!result.success) {
            ctx.statusCode = 200;
            return {
                status: 'DUPLICATE FOUND',
                orders: result.orders
            };
        } else {
            return {
                status: 'STATEMENT CREATED',
                statement: result.statement,
                statementItem: result.statementItem
            };
        }
    }

    /**
     * @api {get} /statement/ get all files statements
     * @apiName get all files statements
     * @apiGroup Statement
     * @apiSuccessExample {json} Example response:
     * [ {
     *      "id": 1,
     *      "link": "http://sbervm.ru:80/recommendation/statement_1.xlsx",
     *      "dateStart": "2016-03-31T21:00:00.000Z",
     *      "dateEnd": "2016-04-30T21:00:00.000Z",
     * } ]
     */
    actionGetAllStatement(ctx) {
        return statementView.renderStatements(
            statementService.getAll()
        );
    }

    /**
     * @api {get} /statement/count-payments-test
     * @apiName count payments for integration tests
     * @apiGroup Test
     */
    actionCountPaymentsTest(actionContext, sberOrderId) {
        return await(statementService.generateReportTest(sberOrderId));
    }
};
