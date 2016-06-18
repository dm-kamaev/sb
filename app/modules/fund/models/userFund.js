'use strict';

module.exports = function(sequelize, DataTypes) {
    var UserFund = sequelize.define('UserFund', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        title: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        underscored: true,
        tableName: 'user_fund',
        classMethods: {
            associate: function(models) {
                // UserFund.hasMany(models.Entity, {
                //     as: 'funds'
                // });
            }
        }
    })
    return UserFund;
}
