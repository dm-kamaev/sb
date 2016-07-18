'use strict';

module.exports = function(sequelize, DataTypes) {
    var SberUser = sequelize.define('SberUser', {
        authId: {
            allowNull: true,
            references: {
                model: 'user',
                key: 'id'
            },
            type: DataTypes.INTEGER,
            onDelete: 'cascade'
        },
        userFundId: {
            allowNull: true,
            references: {
                model: 'UserFund',
                key: 'id'
            },
            type: DataTypes.INTEGER
        },
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        }
    }, {
        tableName: 'SberUser',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                SberUser.belongsTo(models.AuthUser, {
                    as: 'authUser',
                    foreignKey: 'authId'
                });
                SberUser.belongsTo(models.UserFund, {
                    as: 'friendFund',
                    foreignKey: 'userFundId'
                });
                SberUser.hasOne(models.UserFund, {
                    as: 'userFund',
                    foreignKey: 'creatorId'
                });
                SberUser.hasOne(models.Phone, {
                    as: 'phone',
                    foreignKey: 'sberUserId'
                });
            }
        }
    });
    return SberUser;
};
