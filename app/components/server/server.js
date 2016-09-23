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
app.use('/static', express.static(path.join(__dirname, '../../../public/frontend/static')));
app.use(express.static(path.join(__dirname, '../../../public/frontend/static')));
app.use('/entities', express.static(path.join(__dirname, '../../../public/uploads/entities')));

app.use('/callback', callbackRouter);

app.use(session);
app.use(passport.init);
app.use(passport.session);

app.use(headers);

app.use(/\/v?\d*\.?\d*\/?entity/, entityRoutes);
app.use(/\/v?\d*\.?\d*\/?user-fund/, userFundRoutes);
app.use(/\/v?\d*\.?\d*\/?user/, userRouter);
app.use(/\/v?\d*\.?\d*\/?auth/, authRouter);
app.use(/\/v?\d*\.?\d*\/?order/, orderRouter);

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
    if (status >= 500) {
        logger.critical(prettyJSON(err));
    }
});

module.exports = http.createServer(app);
