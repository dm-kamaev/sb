'use strict';
const orderStatus = require('../enums/orderStatus');
const orderTypes = require('../enums/orderTypes');
const StatusError = require('../../../components/errors').StatusError;

module.exports = function(sequelize, DataTypes) {
    var Order = sequelize.define('Order', {
        userFundSubscriptionId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'UserFundSubscription',
                key: 'id'
            },
            allowNull: false
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
            type: DataTypes.TEXT,
        },
        sberAcquActionCodeDescription: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.STRING,
            validate: {
                isIn: [ Object.keys(orderStatus)
                              .map(status => orderStatus[status]) ]
            },
            defaultValue: orderStatus.NEW,
            allowNull: false
        },
        scheduledPayDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        type: {
            type: DataTypes.STRING,
            validate: {
                isIn: [ Object.keys(orderTypes)
                              .map(type => orderTypes[type]) ]
            },
            defaultValue: orderTypes.FIRST,
            allowNull: false
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
        userFundSnapshot: {
            type: DataTypes.JSONB,
            allowNull: true
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
                Order.belongsTo(models.UserFundSubscription, {
                    as: 'userFundSubscription',
                    foreignKey: 'userFundSubscriptionId'
                });
                Order.hasOne(models.OrderItem, {
                    as: 'orderItem',
                    foreignKey: 'sberAcquOrderNumber'
                });
            }
        }
    });
    return Order;
};
