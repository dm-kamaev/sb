'use strict';

module.exports = function(sequelize, DataTypes) {
    var DesiredAmountHistory = sequelize.define('DesiredAmountHistory', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        sberUserUserFundId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'SberUserUserFund',
                key: 'id'
            },
            allowNull: false
        },
        payDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        changer: {
            type: DataTypes.STRING
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'DesiredAmountHistory',
        unserscored: true,
        classMethods: {
            associate: function(models) {
                DesiredAmountHistory.belongsTo(models.SberUserUserFund, {
                    as: 'suuf', // rename this
                    foreginKey: 'userFundUserId'
                });
            }
        }
    });

    return DesiredAmountHistory;
};
