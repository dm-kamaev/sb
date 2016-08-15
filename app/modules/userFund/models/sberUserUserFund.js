'use strict';

module.exports = function(sequelize, DataTypes) {
    var SberUserUserFund = sequelize.define('SberUserUserFund', {
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
        tableName: 'SberUserUserFund',
        unserscored: true,
        classMethods: {
            associate: function(models) {
                SberUserUserFund.belongsTo(models.DesiredAmountHistory, {
                    as: 'currentAmount',
                    foreginKey: 'currentAmountId'
                });
                SberUserUserFund.hasMany(models.DesiredAmountHistory, {
                    as: 'amountChangeHistory',
                    foreginKey: 'sberUserUserFundId'
                });
                SberUserUserFund.hasMany(models.Order, {
                    as: 'order',
                    foreginKey: 'sberUserUserFundId'
                });
                SberUserUserFund.belongsTo(models.SberUser, {
                    as: 'sberUser',
                    foreginKey: 'sberUserId'
                });
                SberUserUserFund.belongsTo(models.UserFund, {
                    as: 'userFund',
                    foreginKey: 'userFundId'
                });
            }
        }
    });
    return SberUserUserFund;
};
