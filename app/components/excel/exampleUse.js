'use strict';

// EXAMPLES FOR USE

const excel = require('./index.js');
const async = require('asyncawait/async');
const log = console.log;

var sheets = excel.createSheets(
    [
        {
            name: 'Sheet 1',
            value: [ [1, 2, 3], [4, 5, 6] ],
            style: {
                font: { size: 12, color: '#FF0800' },
                numberFormat: '$#,##0.00; ($#,##0.00); -' }
        }
    ]
);
log(sheets);

async(() => {
    var resultWrite = excel.write(
    '/home/gorod/sber-together-api/public/uploads/recommendation/test.xlsx',
    sheets
  );
    log('resultWrite=', resultWrite);
})();
