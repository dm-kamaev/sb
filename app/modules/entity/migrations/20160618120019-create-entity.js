'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('entity', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            title: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.TEXT
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            type: {
              type: Sequelize.STRING,
              validate: {
                isIn: ['Fund', 'Topic', 'Direction']
              }
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            deletedAt: {
              type: Sequelize.DATE
            }
        })
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('entity')
    }
};
