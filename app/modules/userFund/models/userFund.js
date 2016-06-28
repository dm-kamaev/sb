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
        // creatorId: {
        //   type: Sequelize.INTEGER,
        //   references: {
        //       model: 'User',
        //       key: 'id'
        //   }
        // },
    }, {
        tableName: 'UserFund',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                // UserFund.hasMany(models.User, {
                //     as: 'member',
                //     through: 'UserFundUser',
                //     foreignKey: 'memberId'
                // });
                UserFund.belongsToMany(models.Entity, {
                    as: 'entity',
                    through: 'UserFundEntity',
                    foreignKey: 'userFundId',
                    otherKey: 'entityId'
                });
            }
        }
    });
    return UserFund;
};
