'use strict';

const sequelize = require('../../sequelize/sequelize');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return sequelize.query('CREATE TABLE IF NOT EXISTS "Sessions" (' +
        'sid character varying(255) NOT NULL,' +
        'expires timestamp with time zone,' +
        'data text,' +
        '"createdAt" timestamp with time zone NOT NULL,' +
        '"updatedAt" timestamp with time zone NOT NULL' +
        ');');
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.dropTable('Sessions');
    }
};
