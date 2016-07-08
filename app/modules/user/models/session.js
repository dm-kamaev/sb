'use strict';

module.exports = function(sequelize, DataTypes) {
    var Session = sequelize.define('Session', {
        sid: {
            primaryKey: true,
            type: DataTypes.STRING,
        },
        expires: {
            type: DataTypes.DATE
        },
        data: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'Sessions',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {

            }
        }
    });
    return Session;
};
