'use strict';

module.exports = function(sequelize, DataTypes) {
    var Card = sequelize.define('Card', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        sberUserId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'SberUser',
                key: 'id'
            },
            allowNull: false
        },
        expiration: {
            type: DataTypes.DATE
        },
        PAN: {
            type: DataTypes.STRING
        },
        cardHolderName: {
            type: DataTypes.STRING
        },
        bindingId: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'Card',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                Card.belongsTo(models.SberUser, {
                    as: 'owner',
                    foreignKey: 'sberUserId'
                });
            }
        }
    });
    return Card;
};
