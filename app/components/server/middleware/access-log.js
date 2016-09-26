'use strict';

const expressLogStream = require('../../logger/expressLogStream');
const morgan = require('morgan');


exports.debug = morgan('dev', {
    // skip: (req, res) => false,
    skip: (req, res) => res.statusCode >= 400,
    stream: expressLogStream.debug
});

exports.warning = morgan('dev', {
    // skip: (req, res) => false,
    skip: (req, res) => res.statusCode < 400,
    stream: expressLogStream.warning
});
