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
                SberUser.hasOne(models.UserFund, {
                    as: 'userFund',
                    foreignKey: 'creatorId'
                });
                SberUser.hasOne(models.Phone, {
                    as: 'phone',
                    foreignKey: 'sberUserId'
                });
                SberUser.belongsToMany(models.UserFund, {
                    as: 'friendFund',
                    through: 'UserFundUser',
                    foreginKey: 'sberUserId',
                    otherKey: 'userFundId'
                });
            }
        }
    });
    return SberUser;
};
