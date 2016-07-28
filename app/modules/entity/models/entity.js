'use strict';

module.exports = function(sequelize, DataTypes) {
    var Entity = sequelize.define('Entity', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        title: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.TEXT,
            validate: {
                len: {
                    args: [0, 500],
                    msg: 'Длина описания должна быть до 500 символов.'
                }
            }
        },
        imgUrl: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                is: {
                    args: /^(topic|direction|fund)$/i,
                    msg: 'Тип может быть только "fund", "topic" или "direction"'
                }
            }
        },
        published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'Entity',
        unserscored: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                Entity.belongsToMany(Entity, {
                    as: 'childEntity',
                    through: 'EntityOtherEntity',
                    foreignKey: 'entityId',
                    otherKey: 'otherEntityId'
                });
                Entity.belongsToMany(models.UserFund, {
                    as: 'userFund',
                    through: 'UserFundEntity',
                    foreignKey: 'entityId',
                    otherKey: 'userFundId'
                });
            }
        },
        hooks: {
            beforeCreate: function(entity, opts, cb) {
                if (entity.imgUrl) return cb(null, opts);
                switch (entity.type.toLowerCase()) {
                case 'fund':
                    entity.imgUrl = 'entity_pics/defaultFund.png';
                    break;
                case 'topic':
                    entity.imgUrl = 'entity_pics/defaultTopic.png';
                    break;
                case 'direction':
                    entity.imgUrl = 'entity_pics/defaultDirection.png';
                    break;
                }
                cb(null, opts);
            }
        }
    });
    return Entity;
};
