'use strict';

const Controller = require('nodules/controller').Controller;
const statementService = require('../services/statementService.js');
const statementView = require('../views/statementView.js');
const errors = require('../../../components/errors');
const util = require('util');
const orderService = require('../../orders/services/orderService')
const statementStatus = require('../enums/statementStatus');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const fs = require('fs')

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
        var file = await(new Promise((resolve, reject) => {
          fs.readFile(ctx.request.file.path, (err, file) => {
              if (err) reject(err);
              resolve(file)
          })
        }))

        var dateStart = ctx.data.dateStart,
            dateEnd = ctx.data.dateEnd;

        if (!file || !dateStart || !dateEnd) {
            throw new errors.HttpError('Wrong request', 400);
        }

        var statement = statementService.createStatement({
            dateStart,
            dateEnd,
            fileName: ctx.data.fileName,
            status: statementStatus.PROCESSING
        })

        process.nextTick(async(() => {
            var statementOrders = statementService.parseStatement(file);
            var orders = orderService.getOrders({
                sberAcquOrderNumber: {
                    $in: statementOrders.map(order => order.sberAcquOrderNumber)
                }
            })
            var recommendation = statementService.countPayments(statementOrders.map(statement => {
                var order = orders.find(order => {
                  return statement.sberAcquOrderNumber == order.sberAcquOrderNumber
                })

                return {
                    userFundSnapshot: order.userFundSnapshot,
                    amount: statement.amount
                }
            }))
            var filePath = statementService.writeInExcel(recommendation)
            statementService.updateStatement(statement.id, {
                status: statementStatus.READY,
                recommendation: filePath,
                statementOrders
            });
        }))

        return statement;
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
        return await (statementService.generateReportTest(sberOrderId));
    }
    /**
     * @api {delete} /statement/:id delete statement
     * @apiGroup Statement
     * @apiName delete statement
     * @apiParam {Number} id id of statement to delete
     */
    actionDeleteStatement(ctx, id) {
        return await(statementService.deleteStatement({ id }))
    }
};
