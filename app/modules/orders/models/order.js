'use strict';
const orderStatus = require('../enums/orderStatus');
const StatusError = require('../../../components/errors').StatusError;

module.exports = function(sequelize, DataTypes) {
    var Order = sequelize.define('Order', {
        userFundSubscriptionId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'UserFundSubsription',
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
        sberAcquActionCodeDescription: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.STRING,
            validate: {
                isIn: [ Object.keys(orderStatus)
                              .map(status => orderStatus[status]) ]
            },
            // set: function(status) {
            //     return;
            //     // need to somehow get current status from database
            //     // var currentStatus = this.getDataValue('status')
            //     sequelize.query('SELECT "status" FROM "Order"')
            //     switch(currentStatus){
            //         case orderStatus.FAILED:
            //         case orderStatus.PAID:
            //         case orderStatus.EQ_ORDER_NOT_CREATED:
            //               throw new StatusError(currentStatus, status)
            //         case orderStatus.WAITING_FOR_PAY:
            //               if (status != orderStatus.CONFIRMING_PAYMENT) {
            //                   throw new StatusError(currentStatus, status)
            //               }
            //               this.setDataValue('status', status);
            //               break;
            //         case orderStatus.CONFIRMING_PAYMENT:
            //               if (status != orderStatus.WAITING_FOR_PAY
            //                          || status != orderStatus.PAID
            //                          || status != orderStatus.FAILED) {
            //                   throw new StatusError(currentStatus, status)
            //               }
            //               this.setDataValue('status', status);
            //               break;
            //         case orderStatus.NEW:
            //               if (status != orderStatus.WAITING_FOR_PAY
            //                   || status != orderStatus.EQ_ORDER_NOT_CREATED) {
            //                   throw new StatusError(currentStatus, status)
            //               }
            //               this.setDataValue('status', status)
            //               break;
            //         default:
            //               this.setDataValue('status', orderStatus.NEW)
            //       }
            //   },
              defaultValue: orderStatus.NEW
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
                Order.belongsTo(models.UserFundSubsription, {
                    as: 'userFundSubscription',
                    foreignKey: 'userFundSubscriptionId'
                });
                Order.hasMany(models.OrderItem, {
                    as: 'orderItem',
                    foreignKey: 'sberAcquOrderNumber'
                });
            }
        }
    });
    return Order;
};
