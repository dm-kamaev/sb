const express = require('express');
const logger = require('../logger/logger').getLogger('main');
const bodyParser = require('body-parser');

const initLogging = require('./middleware/access-log');
const initHeaders = require('./middleware/headers');
const initRoutes = require('./routes');
//const initPassport = require('./middleware/passport');
//const initSession = require('./middleware/sessions');
const ControllerError = require('nodules/controller/ControllerError');
const i18n = require('../i18n');


const app = express();

initLogging(app);
initHeaders(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//initSession(app);
//initPassport(app);
initRoutes(app);


// error handling
app.use(function(err, req, res, next) {
    var result;
    // Controller errors
    if (err instanceof ControllerError) {
        res.status(err.status);
        result = [{
            code: err.code,
            message: err.message
        }];
        res.send(result);

    // Validation errors
    } else if (err.name == 'SequelizeValidationError') {
        res.status(422);
        result = [{
            code: 'ValidationError',
            validationErrors: err.errors
        }];
        res.send(result);

    // Un gandled errors
    } else {
        res.status(500);
        result = [{
            code: 'InternalServerError',
            message: err.message
        }];
        logger.critical(err);
        res.send(result);
    }
});

// catch 404 and forward to error handler
app.use(function(req, res) {
    res.status('404');
    res.send([{
        code: 'NotFound',
        message: i18n.__('Page not found')
    }]);
});


var server = require('http').createServer(app);

module.exports = server;
