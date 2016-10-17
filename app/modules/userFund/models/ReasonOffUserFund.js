'use strict';

module.exports = function(sequelize, DataTypes) {
    var ReasonOffUserFund = sequelize.define('ReasonOffUserFund', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        sberUserId: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: {
                model: 'SberUser',
                key: 'id'
            },
        },
        userFundId: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: {
                model: 'UserFund',
                key: 'id'
            },
        },
        message: {
            type: DataTypes.TEXT
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
        tableName: 'ReasonOffUserFund',
        unserscored: true,
        classMethods: {
            associate: function(models) {

                ReasonOffUserFund.belongsTo(models.UserFund, {
                    as:         'sberUser',
                    foreignKey: 'sberUserId'
                });

                ReasonOffUserFund.belongsTo(models.UserFund, {
                    as:         'userFund',
                    foreignKey: 'userFundId'
                });
            }
        }
    });
    return ReasonOffUserFund;
};
