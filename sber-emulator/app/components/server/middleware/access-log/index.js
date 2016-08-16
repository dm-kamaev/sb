const expressLogStream = require('../../../logger/expressLogStream');
const morgan = require('morgan');


module.exports = function(app) {
    app.use(morgan('dev', {
        skip: (req, res) => res.statusCode >= 400,
        stream: expressLogStream.debug
    }));
    app.use(morgan('dev', {
        skip: (req, res) => res.statusCode < 400,
        stream: expressLogStream.warning
    }));
};
