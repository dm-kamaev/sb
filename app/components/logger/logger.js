const loggers = require('../../../config/loggers');
var intel = require('intel');
intel.config(loggers)
module.exports = intel;
