'use strict';


module.exports = function(sequelize, DataTypes) {
    var Phone = sequelize.define('Phone', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        sberUserId: {
            allowNull: false,
            references: {
                model: 'SberUser',
                key: 'id'
            },
            type: DataTypes.INTEGER
        }
    }, {
        tableName: 'Phone',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                Phone.belongsTo(models.SberUser, {
                    as: 'sberUser',
                    foreignKey: 'sberUserId'
                });
            }
        }
    });
    return Phone;
};
