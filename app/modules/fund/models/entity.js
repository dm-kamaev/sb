'use strict';

module.exports = function(sequelize, DataTypes) {
    var Entity = sequelize.define('Entity', {
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
        tableName: 'entity',
        unserscored: true,
        classMethods: {
            associate: function(models) {
                Entity.belongsToMany(Entity, {
                    as: 'trend',
                    through: 'entities_assosciations'
                });
                Entity.belongsToMany(Entity, {
                    as: 'category',
                    through: 'entities_assosciations'
                });
                Entity.belongsToMany(Entity, {
                    as: 'funds',
                    through: 'entities_assosciations'
                });
                Entity.hasMany(models.UserFund, {
                  as: 'user_fund_id'
                })
            }
        }
    })
    return Entity;
}
