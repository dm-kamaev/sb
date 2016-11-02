'use strict';

const express = require('express');
const http = require('http');
const logger = require('../logger').getLogger('main');
const prettyJSON = require('../prettyJSON');
const bodyparser = require('body-parser');
const path = require('path');

const debugForm = require('./middleware/debugForm');

var app = express();

const entityRoutes = require('../../modules/entity/router');
const userFundRoutes = require('../../modules/userFund/router');
const userRouter = require('../../modules/user/router');
const authRouter = require('../../modules/auth/router');
const callbackRouter = require('../../modules/sberAcquiring/router');
const orderRouter = require('../../modules/orders/router');
const statementRouter = require('../../modules/statement/router');
const techRouter = require('../../modules/tech/router');
const mailRouter = require('../../modules/mail/router');

const headers = require('./middleware/headers');
const session = require('./middleware/session/session');
const passport = require('./middleware/passport');
const anonymous = require('./middleware/anonymous');
const metaTags = require('./middleware/metaTags');
const accesslog = require('./middleware/access-log');
const hideRoutes = require('./middleware/hideRoutes');
const cordovaSession = require('./middleware/session/cordova');
const cordovaSessionParser = require('./middleware/session/cordovaSessionParser.js');

app.use('/dev', hideRoutes, debugForm);

app.set('view engine', 'pug');

app.use(accesslog.debug);
app.use(accesslog.warning);

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: false
}));

app.use(metaTags);

app.set('views', path.join(__dirname, '../../../public/meta_templates'));

app.use('/doc', hideRoutes, express.static(path.join(__dirname, '../../../public/doc')));
app.use('/static', express.static(path.join(__dirname, '../../../public/frontend/static')));
app.use(express.static(path.join(__dirname, '../../../public/frontend/static')));
app.use('/entities', express.static(path.join(__dirname, '../../../public/uploads/entities')));
app.use('/mail_static', express.static(path.join(__dirname, '../../../public/mail_static')))
app.use('/recommendation', express.static(path.join(__dirname, '../../../public/uploads/recommendation')))
app.use('/statement', express.static(path.join(__dirname, '../../../public/uploads/statement')))

app.use('/callback', callbackRouter);
app.use(cordovaSessionParser);
app.use(session);
app.use(passport.init);
app.use(passport.session);

app.use(headers);
app.use(cordovaSession);

app.use(/\/v?\d*\.?\d*\/?entity/, entityRoutes);
app.use(/\/v?\d*\.?\d*\/?user-fund/, userFundRoutes);
app.use(/\/v?\d*\.?\d*\/?user/, userRouter);
app.use(/\/v?\d*\.?\d*\/?auth/, authRouter);
app.use(/\/v?\d*\.?\d*\/?order/, orderRouter);
app.use(/\/v?\d*\.?\d*\/?statement/, statementRouter);
app.use(/\/v?\d*\.?\d*\/?tech/, techRouter);
app.use(/\/v?\d*\.?\d*\/?mail/, mailRouter);

app.use((req, res, next) => {
    res.status(404).json([{
        code: 'NotFoundError',
        message: 'Not found'
    }]);
});

app.use((err, req, res, next) => {
    var status;
    switch (err.name || err.data && err.data[0].code) {
        case 'ValidationError':
            status = 422;
            break;
        case 'MicroServiceError':
            status = 422;
            break;
        case 'NotFoundError':
            status = 404;
            break;
        case 'AcquiringError':
            status = 503;
            break;
    }

    status = status || err.statusCode || err.status || 500;

    res.status(status).json([{
        code: err.name,
        message: err.message || err.data && err.data[0].message || 'Internal server error',
        validationErrors: err.microServiceErrors || err.validationErrors ||
                  err.data && err.data[0].validationErrors
    }]);
    if (status >= 500) {
        logger.critical(err);
    }
});

module.exports = http.createServer(app);
