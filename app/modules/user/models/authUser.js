'use strict';

module.exports = function(sequelize, DataTypes) {
    var AuthUser = sequelize.define('AuthUser', {
        facebookId: {
            type: DataTypes.STRING,
            field: 'facebook_id',
            unique: true
        },
        vkId: {
            type: DataTypes.STRING,
            field: 'vk_id',
            unique: true
        },
        okId: {
            type: DataTypes.STRING,
            unique: true
        },
        googleId: {
            type: DataTypes.STRING,
            field: 'google_id',
            unique: true
        },
        firstName: {
            type: DataTypes.STRING(100),
            field: 'first_name'
        },
        lastName: {
            type: DataTypes.STRING(100),
            field: 'last_name'
        },
        gender: DataTypes.CHAR(1),
        email: DataTypes.STRING(255),
        photoUrl: DataTypes.STRING,
        password: DataTypes.STRING,
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active'
        }
    }, {
        tableName: 'user',
        underscored: true,
        classMethods: {
            associate: function(models) {
                AuthUser.hasOne(models.SberUser, {
                    as: 'userFund',
                    foreignKey: 'authId'
                });
            }
        }
    });

    return AuthUser;
};
