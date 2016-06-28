'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.createTable('UserFundEntity', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            userFundId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'UserFund',
                    key: 'id'
                }
            },
            entityId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Entity',
                    key: 'id'
                }
            },
            createdAt: {
                type: Sequelize.DATE
            },
            updatedAt: {
                type: Sequelize.DATE
            }
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.dropTable('UserFundEntity');
    }
};
