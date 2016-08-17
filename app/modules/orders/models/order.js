'use strict';

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
                isIn: [['new', 'waitingForPay', 'eqOrderNotCreated',
                                    'confirmingPayment', 'paid', 'failed']]
            }
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
            }
        }
    });
    return Order;
};
