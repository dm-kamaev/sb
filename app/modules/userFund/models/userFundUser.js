'use strict';

module.exports = function(sequelize, DataTypes) {
    var UserFundUser = sequelize.define('UserFundUser', {
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
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'UserFundUser',
        unserscored: true,
        classMethods: {
            associate: function(models) {

            }
        }
    });
    return UserFundUser;
};
