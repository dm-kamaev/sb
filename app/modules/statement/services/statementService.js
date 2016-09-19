'use strict';

const sequelize = require('../../../components/sequelize');
var StateMentService = {};

StateMentService.parseStatement = function(file) {
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

module.exports = StateMentService;