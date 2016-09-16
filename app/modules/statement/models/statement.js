'use strict';

module.exports = function(sequelize, DataTypes) {
    var Statement = sequelize.define('Statement', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        dateStart: {
            type: DataTypes.DATE,
            allowNull: false
        },
        dateEnd: {
            type: DataTypes.DATE,
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
        tableName: 'Statement',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                Statement.hasMany(models.StatementItem, {
                    as: 'statementItem',
                    foreignKey: 'statementId'
                })
            }
        }
    });
    return Statement;
};
