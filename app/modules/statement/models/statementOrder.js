'use strict';

module.exports = function(sequelize, DataTypes) {
    var StatementOrder = sequelize.define('StatementOrder', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        sberAcquOrderNumber: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Order',
                key: 'sberAcquOrderNumber'
            },
            allowNull: false
        },
        chargeDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        supplyDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        statementId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Statement',
                key: 'id'
            },
            allowNull: false
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
        tableName: 'StatementOrder',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                StatementOrder.belongsTo(models.Statement, {
                    as: 'statement',
                    foreignKey: 'statementId'
                });
            }
        }
    });
    return StatementOrder;
};
