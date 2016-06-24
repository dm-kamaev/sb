'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('EntityIdOtherEntityId', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            entityId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Entity',
                    key: 'id'
                }
            },
            otherEntityId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Entity',
                    key: 'id'
                }
            },
            createdAt: {
                type: Sequelize.DATE
            },
            updatedAt: {
                type: Sequelize.DATE
            }
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('EntityIdOtherEntityId');
    }
};
