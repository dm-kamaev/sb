'use strict';

const sequelize = require('../../sequelize/sequelize');

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.createTable('Sessions', {
            sid: {
                type: Sequelize.STRING,
                primaryKey: true
            },
            expires: {
                type: Sequelize.DATE
            },
            data: {
                type: Sequelize.TEXT
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.dropTable('Sessions');
    }
};
