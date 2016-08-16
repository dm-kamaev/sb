const config = require('../../../config/loggers');
const IntelWrapper = require('nodules/logger');

var params = {
    loggers: config.loggers
};

if (config.fileOptions) {
    params.fileOptions = config.fileOptions;
}

var intelWrapper = new IntelWrapper(params);


module.exports = intelWrapper.intel;
