'use strict';

const Controller = require('nodules/controller').Controller;
const statementService = require('../services/statementService');
const await = require('asyncawait/await');

module.exports = class StatementController extends Controller {
  actionUploadStatement(ctx) {
      var file = ctx.request.file && ctx.request.file.buffer.toString(),
          dateStart = ctx.data.dateStart,
          dateEnd = ctx.data.dateEnd

      if (!file || !dateStart || !dateEnd) {
          throw new errors.HttpError('Wrong request', 400)
      }

      var bankOrders = statementService.parseStatement(file)

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
          }
      } else {
          return {
              status: 'STATEMENT CREATED',
              statement: result.statement,
              statementItem: result.statementItem
          };
      }
  }
}
