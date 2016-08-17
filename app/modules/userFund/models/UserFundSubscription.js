'use strict';

module.exports = function(sequelize, DataTypes) {
    var UserFundSubsription = sequelize.define('UserFundSubsription', {
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
        tableName: 'UserFundSubsription',
        unserscored: true,
        classMethods: {
            associate: function(models) {
                UserFundSubsription.belongsTo(models.DesiredAmountHistory, {
                    as: 'currentAmount',
                    foreignKey: 'currentAmountId'
                });
                UserFundSubsription.hasMany(models.DesiredAmountHistory, {
                    as: 'amountChangeHistory',
                    foreignKey: 'userFundSubscriptionId'
                });
                UserFundSubsription.hasMany(models.Order, {
                    as: 'order',
                    foreignKey: 'userFundSubscriptionId'
                });
                UserFundSubsription.belongsTo(models.SberUser, {
                    as: 'sberUser',
                    foreignKey: 'sberUserId'
                });
                UserFundSubsription.belongsTo(models.UserFund, {
                    as: 'userFund',
                    foreignKey: 'userFundId'
                });
            }
        }
    });
    return UserFundSubsription;
};
