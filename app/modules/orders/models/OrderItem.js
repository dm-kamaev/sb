'use strict';

module.exports = function(sequelize, DataTypes) {
    var OrderItem = sequelize.define('OrderItem', {
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
            },
            allowNull: false
        },
        sberAcquOrderNumber: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Order',
                key:'sberAcquOrderNumber'
            },
            allowNull: false
        },
        uncovered: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.TEXT
        },
        type: {
            type: DataTypes.STRING,
        },
        imgUrl: {
            type: DataTypes.STRING
        },
        createdAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        updatedAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        deletedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'OrderItem',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                OrderItem.belongsTo(models.Order, {
                    as: 'order',
                    foreignKey: 'sberAcquOrderNumber'
                });
                OrderItem.belongsTo(models.Entity, {
                    as: 'entity',
                    foreignKey: 'entityId'
                });
            }
        }
    });
    return OrderItem;
};
