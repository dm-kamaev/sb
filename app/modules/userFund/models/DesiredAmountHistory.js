'use strict';

module.exports = function(sequelize, DataTypes) {
    var DesiredAmountHistory = sequelize.define('DesiredAmountHistory', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        SberUserUserFundId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'SberUserUserFund',
                key: 'id'
            },
            allowNull: false,
            field: 'sberUserUserFundId'
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: 100,
                    msg: 'Минимальная сумма пожертвования 100 рублей'
                },
                max: {
                    args: 500000,
                    msg: 'Мы не можем принять от вас сразу больше, чем 500 тыс. рублей'
                }
            }
        },
        payDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        changer: {
            type: DataTypes.STRING,
            validate: {
                isIn: ['user', 'admin']
            }
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'DesiredAmountHistory',
        unserscored: true,
        classMethods: {
            associate: function(models) {

            }
        }
    });

    return DesiredAmountHistory;
};
