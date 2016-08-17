'use strict';
module.exports = {
    up: function(queryInterface, DataTypes) {
        return queryInterface.createTable('Order', {
            orderId: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID
            },
            orderNumber: {
                allowNull: false,
                type: DataTypes.INTEGER,
                unique: true
            },
            paid: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            amount: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            clientId: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            binding: {
                allowNull: true,
                type: DataTypes.UUID
            },
            createdAt: {
                type: DataTypes.DATE
            },
            updatedAt: {
                type: DataTypes.DATE
            }
        });
    },
    down: function(queryInterface, DataTypes) {
        return queryInterface.dropTable('Order');
    }
};
