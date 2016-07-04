'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.createTable('SberUser', {
            authId: {
                allowNull: true,
                references: {
                    model: 'user',
                    key: 'id'
                },
                type: Sequelize.INTEGER,
                onDelete: 'cascade'
            },
            userFundId: {
                allowNull: true,
                references: {
                    model: 'UserFund',
                    key: 'id'
                },
                type: Sequelize.INTEGER
            },
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            deletedAt: {
                type: Sequelize.DATE
            }
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.dropTable('SberUser');
    }
};
