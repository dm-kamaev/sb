'use strict';
const express = require('express');
const http = require('http');
const logger = require('../logger').getLogger('main');
const bodyparser = require('body-parser');
const path = require('path');

const accesslog = require('./middleware/access-log');
const debugForm = require('./middleware/debugForm');

var app = express();

const entityRoutes = require('../../modules/entity/router');
const userFundRoutes = require('../../modules/userFund/router');
const headers = require('./middleware/headers');

app.use('/doc', express.static(path.join(__dirname, '../../../public/doc')));
app.use('/', express.static(path.join(__dirname, '../../../public/frontend')));

app.use('/', debugForm);

app.use(accesslog.debug);
app.use(accesslog.warning);

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: false
}));

app.use(headers);

app.use('/entity', entityRoutes);
app.use('/user-fund', userFundRoutes);

app.use((req, res, next) => {
    res.status(404).json([{
        code: 'NotFoundError',
        message: 'Not found'
    }]);
});

app.use((err, req, res, next) => {
    var status = err.statusCode || 500;
    res.status(status).json([{
        code: err.name,
        message: err.message || 'Internal server error',
        validationErrors: err.validationErrors
    }]);
    if (status >= 500) logger.critical(err);
});

module.exports = http.createServer(app);
