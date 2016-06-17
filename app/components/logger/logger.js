const loggers = require('../../../config/loggers');
const rotatingConfig = require('../../../config/logFileConfig');

const IntelWrapper = require('nodules/logger');

var config = {
    loggers: loggers,
    fileOptions: rotatingConfig
};

var intelWrapper = new IntelWrapper(config);

module.exports = intelWrapper.intel;
