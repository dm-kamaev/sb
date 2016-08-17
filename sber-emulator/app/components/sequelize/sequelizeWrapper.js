const path = require('path');
const sequelize = require('./sequelize');
const SequelizeWrapper = require('nodules/sequelize');
var logger = require('../logger').getLogger('sequelize');

var sequelizeWrapper = new SequelizeWrapper({
    sequelize: sequelize,
    paths: {
        projectRoot: path.resolve(__dirname, '../../..'),
    },
    logging: logger.info.bind(logger)
});
module.exports = sequelizeWrapper;
