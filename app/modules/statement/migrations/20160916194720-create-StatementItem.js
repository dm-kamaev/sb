'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('StatementItem', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            sberAcquOrderNumber: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Order',
                    key: 'sberAcquOrderNumber'
                },
                allowNull: false
            },
            statementId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Statement',
                    key: 'id'
                },
                allowNull: false
            },
            chargeDate: {
                type: Sequelize.DATE,
                allowNull: false
            },
            amount: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            deletedAt: {
                type: Sequelize.DATE
            }
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('StatementItem');
    }
};
