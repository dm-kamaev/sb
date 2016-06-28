'use strict';

module.exports = function(sequelize, DataTypes) {
    var EntityOtherEntity = sequelize.define('EntityOtherEntity', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        entityId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Entity',
                key: 'id'
            }
        },
        otherEntityId: {
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
        tableName: 'EntityOtherEntity',
        unserscored: true,
        classMethods: {
            associate: function(models) {

            }
        }
    });
    return EntityOtherEntity;
};
