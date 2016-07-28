'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('UserFundUser', {
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
                },
                allowNull: false
            },
            sberUserId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'SberUser',
                    key: 'id'
                },
                allowNull: false
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
        return queryInterface.dropTable('UserFundUser');
    }
};
