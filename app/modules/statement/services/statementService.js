'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
var StatementService = {};

StatementService.parseStatement = function(file) {
    var arr = file.toString().split('\r\n'),
        orders = []

    for (var i = 0; i < arr.length; i++) {
        if (~arr[i].indexOf('СекцияДокумент=Банковский ордер')) {
            var order = {
                // sberAcquOrderNumber:
                bankNumber: arr[++i].split('=')[1],
                bankDate: arr[++i].split('=')[1],
                bankAmount: arr[++i].split('=')[1],
                payerBill: arr[++i].split('=')[1],
                dateWriteOff: arr[++i].split('=')[1],
                payerName: arr[++i].split('=')[1],
                payerINN: arr[++i].split('=')[1],
                payerKPP: arr[++i].split('=')[1],
                payerCheckingAccount: arr[++i].split('=')[1],
                payerBank: arr[++i].split('=')[1],
                payerBIK: arr[++i].split('=')[1],
                payerCorrespondentBill: arr[++i].split('=')[1],
                jsonParams: arr[i + 22].split('=')[1]
            }

            i += 22
            orders.push(order)
        }
    }
    return orders;

    // sequelize.models.Statement.create({
    //     fileName:
    // })
}

StatementService.handleStatement = function(data) {
    return await(sequelize.sequelize.transaction(async(t => {
        var orders = await(sequelize.sequelize.query('SELECT * FROM "StatementItem" WHERE "sberAcquOrderNumber" IN (:sberAcquOrderIds)', {
            type: sequelize.sequelize.QueryTypes.SELECT,
            replacements: {
                sberAcquOrderIds: data.bankOrders.map(order => order.sberAcquOrderNumber)
            }
        }));

        if (orders.length) return {
            success: false,
            orders
        };

        var statement = await(sequelize.models.Statement.create(data));

        var statementItem = await(sequelize.models.StatementItem.bulkCreate(data.bankOrders.map(order => Object.assign(order, {
           statementId: statement.id
        }))));

        return {
            success: true,
            statement,
            statementItem
        }
    })))
};

module.exports = StatementService;
