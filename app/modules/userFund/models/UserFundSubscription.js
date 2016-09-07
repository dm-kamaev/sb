'use strict';

module.exports = function(sequelize, DataTypes) {
    var UserFundSubscription = sequelize.define('UserFundSubscription', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        UserFundId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'UserFund',
                key: 'id'
            },
            field: 'userFundId'
        },
        SberUserId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'SberUser',
                key: 'id'
            },
            field: 'sberUserId'
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        currentAmountId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'DesiredAmountHistory',
                key: 'id'
            },
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'UserFundSubscription',
        unserscored: true,
        classMethods: {
            associate: function(models) {
                UserFundSubscription.belongsTo(models.DesiredAmountHistory, {
                    as: 'currentAmount',
                    foreignKey: 'currentAmountId'
                });
                UserFundSubscription.hasMany(models.DesiredAmountHistory, {
                    as: 'amountChangeHistory',
                    foreignKey: 'userFundSubscriptionId'
                });
                UserFundSubscription.hasMany(models.Order, {
                    as: 'order',
                    foreignKey: 'userFundSubscriptionId'
                });
                UserFundSubscription.belongsTo(models.SberUser, {
                    as: 'sberUser',
                    foreignKey: 'sberUserId'
                });
                UserFundSubscription.belongsTo(models.UserFund, {
                    as: 'userFund',
                    foreignKey: 'userFundId'
                });
                UserFundSubscription.hasMany(models.PayDayHistory, {
                    as: 'payDayHistory',
                    foreignKey: 'subscriptionId'
                });
            }
        }
    });
    return UserFundSubscription;
};
