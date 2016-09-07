'use strict';

module.exports = function(sequelize, DataTypes) {
    var PayDayHistory = sequelize.define('PayDayHistory', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        subscriptionId: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: {
                model: 'UserFundSubscription',
                key: 'id'
            },
        },
        payDate: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        },
        deletedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'PayDayHistory',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                PayDayHistory.belongsTo(models.UserFundSubscription, {
                    as: 'subscription',
                    foreignKey: 'subscriptionId'
                });
            }
        }
    }
    );
    return PayDayHistory;
};
