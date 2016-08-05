"use strict";

module.exports = function(sequelize, DataTypes) {
    var Orders = sequelize.define('Orders', {
        suufId: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: {
                model: 'SberUserUserFund',
                key: 'id'
            },
        },
        orderNumber: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        orderId:      DataTypes.STRING,
        amount:       DataTypes.INTEGER,
        errorCode:    DataTypes.INTEGER,
        errorMessage: DataTypes.TEXT,
        actionCode:   DataTypes.INTEGER,
        createdAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        updatedAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
    });
    return Orders;
};