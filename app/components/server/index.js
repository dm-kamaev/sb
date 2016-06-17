'use strict';
const express = require('express');
const http = require('http');
const logger = require('../logger').getLogger('main');
var app = express();


app.use((req, res, next) => {
    res.status(404).json('Not found');
});

app.use((err, req, res, next) => {
    var status = err.statusCode || 500;
    res.status(status).json({
        status: status,
        response: [{
            code: err.name,
            message: err.message || 'Internal server error',
            validationErrors: err.validationErrors
        }]
    });
    if (status >= 500) logger.critical(err);
});

module.exports = http.createServer(app);
