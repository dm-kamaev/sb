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
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                is: /^(topic|direction|fund)$/i
            }
        }
    }, {
        tableName: 'entity',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                Entity.belongsToMany(Entity, {
                    as: 'Entity',
                    through: 'entityId_otherEntityId',
                    foreignKey: 'entity_id',
                    otherKey: 'otherEntity_id'
                });
            }
        }
    })
    return Entity;
}
