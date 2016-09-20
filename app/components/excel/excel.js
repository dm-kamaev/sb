'use strict';

const excel4node = require('excel4node');
const logger     = require('../logger').getLogger('main');
const await      = require('asyncawait/await');


/**
 * write in file .xlsx
 * @param  {[str]}  path –– file path
 * @param  {[obj]} wb    –– object which created exports.createSheets
 * @return {[promise]}
 */
exports.write = function (path, wb) {
    return await(new Promise(function (resolve, reject) {
        wb.write(path, function (err, res) {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    }));
};


/**
 * create sheets for excel file
 * @param  {[array]} data [{ name: 'Sheet 1', value: [ [1,2,3], [4,5,6] ], style: { font: { size: 12} } }]
 * @return {[obj]}   object for write in file
 */
exports.createSheets = function(data) {
    // Create a new instance of a Workbook class
    var wb = new excel4node.Workbook();
    data.forEach(function(sheet) {
        // Add Worksheets to the workbook
        var options = {
            sheetView: {
                'zoomScale': 200,
            },
        };
        var ws    = wb.addWorksheet(sheet.name, options);
        var style = wb.createStyle(sheet.style || {});
        setCell_(ws, sheet.value, style);
    });

    return wb;
};


/**
 * set data in cell
 * @param {[obj]}   ws    object sheets
 * @param {[array]} rows  [ [1,2,3], [4,5,6] ]
 * @param {[obj]}   style style for sheets
 */
function setCell_(ws, rows, style) {
    for (var r = 0, l = rows.length; r < l; r++) {
        var row = rows[r];
        iterateColumn();
    }

    function iterateColumn () {
        for (var c = 0, l1 = row.length; c < l1; c++) {
            var el = row[c];
            var num_row = r + 1,
                num_col = c + 1;
            var cell = ws.cell(num_row, num_col);
            if (typeof el === 'string') {
                cell.string(el).style(style);
            } else if (typeof el === 'number') {
                cell.number(el).style(style);
            } else {
                logger.critical(
                    'Not valid type for elements => type element "'+typeof(el)+'", only number or string'
                );
            }
        }
    }
}