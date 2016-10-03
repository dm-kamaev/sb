'use strict';
const path = require('path');
const logger = require('../logger');
const sequelize = require('./sequelize');
const SequelizeWrapper = require('nodules/sequelize');

var log = logger.getLogger('sequelize');

var sequelizeWrapper = new SequelizeWrapper({
    sequelize: sequelize,
    logging: log.info.bind(log),
    /* logging: function (query) {
        log.info(query
            .replace(/SELECT/, '\nSELECT')
            .replace(/INSERT/, '\nINSERT')
            .replace(/UPDATE/, '\nUPDATE')
            .replace(/FROM/, '\nFROM')
            .replace(/LEFT OUTER JOIN/g, '\nLEFT OUTER JOIN')
            .replace(/WHERE/g, '\nWHERE')
        );
    },*/
    paths: {
        projectRoot: path.resolve(__dirname, '../../..'),
        migrations: '/migrations',
        migrationExecute: 'app/components/sequelize/tmp'
    }
});

module.exports = sequelizeWrapper;
