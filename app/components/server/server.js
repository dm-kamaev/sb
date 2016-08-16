'use strict';

const express = require('express');
const http = require('http');
const logger = require('../logger').getLogger('main');
const bodyparser = require('body-parser');
const path = require('path');

const debugForm = require('./middleware/debugForm');

var app = express();

const entityRoutes = require('../../modules/entity/router');
const userFundRoutes = require('../../modules/userFund/router');
const userRouter = require('../../modules/user/router');
const authRouter = require('../../modules/auth/router');
const callbackRouter = require('../../modules/sberAcquiring/router');

const headers = require('./middleware/headers');
const session = require('./middleware/session/session');
const passport = require('./middleware/passport');
const anonymous = require('./middleware/anonymous');
const metaTags = require('./middleware/metaTags');
const accesslog = require('./middleware/access-log');

app.use('/', debugForm);

app.set('view engine', 'pug');

app.use(accesslog.debug);
app.use(accesslog.warning);

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: false
}));

app.use(metaTags);

app.set('views', path.join(__dirname, '../../../../public/meta_templates'));
app.use('/doc', express.static(path.join(__dirname, '../../../public/doc')));
app.use('/', express.static(path.join(__dirname, '../../../public/frontend')));
app.use('/', express.static(path.join(__dirname, '../../../public/uploads')));

app.use('/callback', callbackRouter);

// app.use(cordovaSession);
app.use(session);
app.use(passport.init);
app.use(passport.session);
app.use(anonymous);

app.use(headers);

app.use('/entity', entityRoutes);
app.use('/user-fund', userFundRoutes);
app.use('/user', userRouter);
app.use('/auth', authRouter);

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
