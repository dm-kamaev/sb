'use strict';
const path = require('path');
const logger = require('../logger');
const sequelize = require('./sequelize');
const SequelizeWrapper = require('nodules/sequelize');

var log = logger.getLogger('sequelize');

var sequelizeWrapper = new SequelizeWrapper({
    sequelize: sequelize,
    logging: log.info.bind(log),
    paths: {
        projectRoot: path.resolve(__dirname, '../../..'),
        migrations: '/migrations',
        migrationExecute: 'app/components/sequelize/tmp'
    }
});

module.exports = sequelizeWrapper;
