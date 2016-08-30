'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('OrderItem', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            entityId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Entity',
                    key: 'id'
                },
                allowNull: false
            },
            sberAcquOrderNumber: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Order',
                    key: 'sberAcquOrderNumber'
                },
                allowNull: false
            },
            uncovered: {
                type: Sequelize.BOOLEAN,
                allowNull: false
            },
            title: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.TEXT
            },
            type: {
                type: Sequelize.STRING,
            },
            imgUrl: {
                type: Sequelize.STRING
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            deletedAt: {
                type: Sequelize.DATE
            }
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('OrderItem');
    }
};
