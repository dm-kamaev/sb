'use strict';

module.exports = function(sequelize, DataTypes) {
    var DesiredAmountHistory = sequelize.define('DesiredAmountHistory', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        subscriptionId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'UserFundSubscription',
                key: 'id'
            },
            allowNull: false,
            field: 'userFundSubscriptionId'
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: 100,
                    msg: 'Минимальная сумма пожертвований 1 рубль'
                },
                max: {
                    args: 50000000,
                    msg: 'Мы не можем принять от вас сразу больше, ' +
                                    'чем 500 тыс. рублей'
                }
            }
        },
        changer: {
            type: DataTypes.STRING,
            validate: {
                isIn: [['user', 'admin']]
            }
        },
        percent: {
            type: DataTypes.INTEGER,
            defaultValue: null,
            validate: {
                min: {
                    args: 1,
                    msg: 'Минимальный процент от доходов: 1%',
                },
                max: {
                    args: 100,
                    msg: 'Максимальный процент от доходов: 100%',
                }
            }
        },
        salary: {
            type: DataTypes.INTEGER,
            defaultValue: null,
            validate: {
                min: {
                    args: 10000,
                    msg: 'Минимальная сумма пожертвования 100 рублей'
                },
                max: {
                    args: 50000000,
                    msg: 'Мы не можем принять от вас сразу больше, чем 500 тыс. рублей'
                }
            }
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        },
        deletedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'DesiredAmountHistory',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {

            }
        }
    });

    return DesiredAmountHistory;
};
