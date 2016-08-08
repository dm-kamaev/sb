"use strict";

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('Orders', {
            sberUserUserFundId: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: 'SberUserUserFund',
                    key: 'id'
                },
            },
            orderNumber: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            orderId:      Sequelize.STRING,
            amount:       {
                allowNull: false,
                type: Sequelize.INTEGER,
            },
            errorCode:    Sequelize.INTEGER,
            errorMessage: Sequelize.TEXT,
            actionCode:   Sequelize.INTEGER,
            actionCodeDescription: Sequelize.TEXT,
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('Orders');
    }
};
