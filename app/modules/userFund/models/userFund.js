'use strict';

module.exports = function(sequelize, DataTypes) {
    var UserFund = sequelize.define('UserFund', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        title: {
            type: DataTypes.STRING,
            validate: {
                max: 50
            }
        },
        description: {
            type: DataTypes.TEXT,
            validate: {
                max: 2000
            }
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        creatorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'SberUser',
                key: 'id'
            },
            allowNull: true
        }
    }, {
        tableName: 'UserFund',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                UserFund.belongsToMany(models.Entity, {
                    as: 'entity',
                    through: 'UserFundEntity',
                    foreignKey: 'userFundId',
                    otherKey: 'entityId',
                    scope: {
                        published: true
                    }
                });
                UserFund.belongsTo(models.SberUser, {
                    as: 'owner',
                    foreignKey: 'creatorId'
                });
                UserFund.belongsToMany(models.SberUser, {
                    as: 'users',
                    through: 'UserFundSubscription',
                    foreignKey: 'userFundId',
                    otherKey: 'sberUserId'
                });
                UserFund.belongsToMany(models.Entity, {
                    as: 'fund',
                    through: 'UserFundEntity',
                    foreignKey: 'userFundId',
                    otherKey: 'entityId',
                    scope: {
                        type: {
                            $iLike: 'fund'
                        },
                        published: true
                    }
                });
                UserFund.belongsToMany(models.Entity, {
                    as: 'direction',
                    through: 'UserFundEntity',
                    foreignKey: 'userFundId',
                    otherKey: 'entityId',
                    scope: {
                        type: {
                            $iLike: 'direction'
                        },
                        published: true
                    }
                });
                UserFund.belongsToMany(models.Entity, {
                    as: 'topic',
                    through: 'UserFundEntity',
                    foreignKey: 'userFundId',
                    otherKey: 'entityId',
                    scope: {
                        type: {
                            $iLike: 'topic'
                        },
                        published: true
                    }
                });
            }
        }
    });
    return UserFund;
};
