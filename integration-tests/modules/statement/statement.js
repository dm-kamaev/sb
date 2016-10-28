'use strict';

const services = require('../../services');
const chakram = require('chakram');
const expect = chakram.expect;
const csvStringify = require('csv-stringify');
const moment = require('moment');
const fs = require('fs')
const stream = require('stream')

exports.upload = function(ctx) {
    var chakram = ctx.chakram,
        expect = ctx.expect;

    return function() {
        var orderRow = Array(15).fill('');
        orderRow[14] = ctx.sberAcquOrderNumber;
        orderRow[7] = moment(ctx.chargeDate).format('DD.MM.YYYY');
        orderRow[6] = moment(ctx.supplyDate).format('DD.MM.YYYY');
        orderRow[9] = ctx.orderAmount * 0.0097;
        var data = [Array(15).fill(''), orderRow];
        var opts = {
            delimiter: ';',
            rowDelimiter: 'windows'
        }
        return new Promise((resolve, reject) => {
            csvStringify(data, opts, function(err, output) {
                if (err) reject(err);

                ctx.csv = output;
                resolve(output);
            })
        })
        .then(csv => {
            var url = services.url('statement/upload'),
                formData = {
                    statement: {
                      value: new Buffer(csv),
                      options: {
                          filename: 'statement',
                          contentType: 'text/csv'
                      }
                    },
                    dateStart: moment().subtract(1, 'day').format('DD.MM.YYYY'),
                    dateEnd: moment().format('DD.MM.YYYY'),
                }
            return chakram.request('POST', url, {
                formData
            })
        })
        .then(res => {
            if (res.error) throw res.error;
            Object.assign(ctx, res.body)
        })
    }
}
