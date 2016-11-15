'use strict';

const mailingCategory = require('../../mail/enum/mailingCategory')

module.exports = function(sequelize, DataTypes) {
    var SberUser = sequelize.define('SberUser', {
        authId: {
            allowNull: true,
            references: {
                model: 'user',
                key: 'id'
            },
            type: DataTypes.INTEGER,
            onDelete: 'cascade'
        },
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        payDay: {
            type: DataTypes.INTEGER,
            // defaultValue:
        },
        paymentNotified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        draftNotified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        categories: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [Object.keys(mailingCategory)
                             .map(category => mailingCategory[category])]
            },
            defaultValue: mailingCategory.ALL
        },
        currentCardId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Card',
                key: 'id'
            }
        },
        popUpAboutAddTopicDirection: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'SberUser',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                SberUser.belongsTo(models.AuthUser, {
                    as: 'authUser',
                    foreignKey: 'authId'
                });
                SberUser.hasOne(models.UserFund, {
                    as: 'userFund',
                    foreignKey: 'creatorId'
                });
                SberUser.belongsToMany(models.UserFund, {
                    as: 'friendFund',
                    through: 'UserFundSubscription',
                    foreignKey: 'sberUserId',
                    otherKey: 'userFundId'
                });
                SberUser.belongsTo(models.Card, {
                    as: 'currentCard',
                    foreignKey: 'currentCardId'
                });
                SberUser.hasMany(models.UserFundSubscription, {
                    as: 'userFundSubscription',
                    foreignKey: 'sberUserId'
                });
            }
        }
    });
    return SberUser;
};
