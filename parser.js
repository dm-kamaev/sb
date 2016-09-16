'use strict';

const fs = require('fs'),
      readline = require('readline')

fs.readFile('./statement.txt', (err, data) => {
    if (err) throw err;
    var arr = data.toString().split('\n')
    var asd = false
    for (var i = 0; i < arr.length; i++) {
        if (asd) console.log(arr[i])
        if (~arr[i].indexOf('СекцияДокумент')){
            var order = {
                order: arr[i].split('=')[1],
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
            console.log(order)
        }
    }
})