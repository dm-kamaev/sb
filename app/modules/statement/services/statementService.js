'use strict';

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const excel = require('../../../components/excel');
const moment = require('moment');
const XLSX = require('xlsx');
const path = require('path')
const fs = require('fs')

var StatementService = {};


/**
 * get all statement (files)
 * @param  {[obj]} where
 * @return {[type]}
 */
StatementService.getAll = function(where) {
    return await (sequelize.models.Statement.findAll({
        where
    }));
};


StatementService.parseStatement = function(file) {

    var workbook = XLSX.read(file)
    var sheetName = workbook.SheetNames[0]
    var worksheet = workbook.Sheets[sheetName];
    var headers = {};
    var data = [];
    for (let z in worksheet) {
        if (z[0] === '!') continue;

        var col = z.substring(0, 1);
        var row = parseInt(z.substring(1));
        var value = worksheet[z].v;

        if (row == 1) {
            headers[col] = value;
            continue;
        }

        if (!data[row]) data[row] = {};
        data[row][headers[col]] = value;
    }
    data.shift()
    data.shift()

    return data.map(e => {
        var dates = e['ДАТА_РАСЧ'].split('.'),
            year = dates[2],
            month = dates[1],
            day = dates[0];

        return {
            sberAcquOrderNumber: e['ID_2'],
            chargeDate: new Date(year, month, day),
            amount: e['СУММА_РАСЧ'] * 100
        }
    })

    return data;
};

StatementService.handleStatement = function(data) {
    return await (sequelize.sequelize.transaction(async(t => {
        var orders = await (sequelize.sequelize.query('SELECT * FROM "StatementItem" WHERE "sberAcquOrderNumber" IN (:sberAcquOrderIds)', {
            type: sequelize.sequelize.QueryTypes.SELECT,
            replacements: {
                sberAcquOrderIds: data.bankOrders.map(order => order.sberAcquOrderNumber)
            }
        }));

        if (orders.length) return {
            success: false,
            orders
        };

        var statement = await (sequelize.models.Statement.create(data));

        var statementItem = await (sequelize.models.StatementItem.bulkCreate(data.bankOrders.map(order => Object.assign(order, {
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
        ['id', 'Имя фонда', 'рекомендуем начислить в этом периоде (коп.)']
    ];
    fundPayments.forEach((fundPayment) => {
        dataForSheet.push(
            [fundPayment.id, fundPayment.title, fundPayment.payment]
        );
    });
    dataForSheet.push(['Остатки', ' ', remainderDivision]);

    var sheet = excel.createSheets(
        [{
            name: 'Рекомендация',
            value: dataForSheet,
        }]
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
