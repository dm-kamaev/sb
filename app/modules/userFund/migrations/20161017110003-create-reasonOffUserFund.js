'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.createTable('ReasonOffUserFund', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            sberUserId: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: 'SberUser',
                    key: 'id'
                },
            },
            userFundId: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: 'UserFund',
                    key: 'id'
                },
            },
            message: {
                type: Sequelize.TEXT
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
        queryInterface.dropTable('ReasonOffUserFund');
    }
};
