'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const excel = require('../../../components/excel');
const moment = require('moment');

var StatementService = {};


/**
 * get all statement (files)
 * @param  {[obj]} where
 * @return {[type]}
 */
StatementService.getAll = function (where) {
    return await(sequelize.models.Statement.findAll({ where }));
};


StatementService.parseStatement = function(file) {
    var arr = file.toString().split('\r\n'),
        orders = [];

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
            };

            i += 22;
            orders.push(order);
        }
    }
    return orders;

    // sequelize.models.Statement.create({
    //     fileName:
    // })
};

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
        };
    })));
};


/**
 * recommendation write in excel.
 * get calculated data for accountant, transform and write in .xlsx
 * @param  {[type]} countPayments { payments: [{"id": 1, "payment": 123456, "title": "qwerty"}], sumModulo: 2345 }
 * @return {[type]}
 */
StatementService.writeInExcel = function(countPayments) {
    var fundPayments = countPayments.payments,
        remainderDivision = countPayments.sumModulo;
    var dataForSheet = [
        [ 'id', 'Имя фонда', 'рекомендуем начислить в этом периоде (коп.)' ]
    ];
    fundPayments.forEach((fundPayment) => {
        dataForSheet.push(
            [ fundPayment.id, fundPayment.title, fundPayment.payment ]
        );
    });
    dataForSheet.push([ 'Остатки', ' ', remainderDivision ]);

    var sheet = excel.createSheets(
        [
            {
                name: 'Рекомендация',
                value: dataForSheet,
            }
        ]
    );
    excel.write(
        '../../../../public/uploads/recommendation/Рекомендация_' +
        moment().format('YYYY_DD_MM') + '.xlsx',
        sheet
    );
};

/**
 * count payments to all funds
 * @param {[array]} paidOrders
 * @return {[object]} {
 *      payments: [{"id": 1, "payment": 123456, "title": "qwerty"}, ...],
 *      sumModulo: 2345
 *  }
 */
StatementService.countPayments = function(approvedOrders) {
    var fundsArray = [];
    var sumModulo = 0;

    approvedOrders.forEach(order => {
        var funds = order.userFundSnapshot.fund;
        var fundsCount = funds.length;
        var fundPayment = Math.trunc(order.amount / fundsCount);
        var modulo = order.amount - (fundPayment * fundsCount);

        funds.forEach(fund => {
            fund.payment = fundPayment;
            var fundIndex = fundsArray.findIndex((elem, index) =>
                elem.id === fund.id);
            // prevent fund duplication in result array
            if (fundIndex != -1) {
                fundsArray[fundIndex].payment += fund.payment;
            } else {
                fundsArray.push(fund);
            }
        });
        sumModulo += modulo;
    });

    var result = {
        payments: fundsArray,
        sumModulo: sumModulo
    };
    return result;
}

//TODO: delete it for production build!
StatementService.generateReportTest = function(sberOrderId) {
    var orders = await (sequelize.models.Order.findAll({
        attributes: ['amount', 'userFundSnapshot'],
        where: {
            sberAcquOrderId: sberOrderId,
            userFundSnapshot: {
                $ne: null
            }
        }
    }));
    return StatementService.countPayments(orders);
};



module.exports = StatementService;
