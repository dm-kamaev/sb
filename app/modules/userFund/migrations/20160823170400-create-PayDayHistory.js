'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.createTable('PayDayHistory', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            subscriptionId: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: 'UserFundSubsription',
                    key: 'id'
                },
            },
            payDate: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            deletedAt: {
                type: Sequelize.DATE
            }
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.dropTable('PayDayHistory');
    }
};
