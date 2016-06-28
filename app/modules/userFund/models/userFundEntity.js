'use strict';

module.exports = function(sequelize, DataTypes) {
    var UserFundEntity = sequelize.define('UserFundEntity', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        userFundId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'UserFund',
                key: 'id'
            }
        },
        entityId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Entity',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'UserFundEntity',
        unserscored: true,
        classMethods: {
            associate: function(models) {

            }
        }
    });
    return UserFundEntity;
};
