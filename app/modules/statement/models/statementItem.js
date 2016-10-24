'use strict';

module.exports = function(sequelize, DataTypes) {
    var StatementItem = sequelize.define('StatementItem', {
        sberAcquOrderNumber: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Order',
                key: 'sberAcquOrderNumber'
            },
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        chargeDate: {
            type: DataTypes.DATE,
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
        tableName: 'StatementItem',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                StatementItem.belongsTo(models.Statement, {
                    as: 'statement',
                    foreignKey: 'statementId'
                });
            }
        }
    });
    return StatementItem;
};
