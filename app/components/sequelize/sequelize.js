'use strict';

const path = require('path');
const Sequelize = require('sequelize');
const cls = require('continuation-local-storage');
const config = require(path.resolve(
    __dirname, '../../../config/db'
));

var namespace = cls.createNamespace('sber-together');
Sequelize.cls = namespace;
var sequelize = new Sequelize(
    config.database, config.username, config.password, config
);

module.exports = sequelize;
