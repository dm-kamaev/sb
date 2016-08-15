'use strict';

module.exports = function(sequelize, DataTypes) {
    var Order = sequelize.define('Order', {
        SberUserUserFundId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'SberUserUserFund',
                key: 'id'
            },
            allowNull: false,
            field: 'sberUserUserFundId'
        },
        sberAcquOrderNumber: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        sberAcquOrderId: {
            type: DataTypes.STRING
        },
        amount: {
            allowNull: false,
            type: DataTypes.INTEGER,
        },
        sberAcquErrorCode: {
            type: DataTypes.INTEGER
        },
        sberAcquErrorMessage: {
            type: DataTypes.TEXT
        },
        sberAcquActionCode: {
            type: DataTypes.INTEGER,
        },
        sberAcquActionCodeDescription: {
            type: DataTypes.INTEGER,
        },
        funds: {
            type: DataTypes.ARRAY(DataTypes.STRING),
        },
        directionsTopicsFunds: {
            type: DataTypes.ARRAY(DataTypes.STRING),
        },
        fundInfo: {
            type: DataTypes.JSONB,
        },
        createdAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        updatedAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        deletedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'Order',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                Order.belongsTo(models.SberUserUserFund, {
                    as: 'sberUserUserFund',
                    foreginKey: 'sberUserUserFundId'
                });
            }
        }
    });
    return Order;
};
