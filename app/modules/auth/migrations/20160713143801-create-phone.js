'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('Phone', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            number: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            code: {
                type: Sequelize.STRING,
                allowNull: false
            },
            verified: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaulValue: false
            },
            sberUserId: {
                allowNull: false,
                references: {
                    model: 'SberUser',
                    key: 'id'
                },
                type: Sequelize.INTEGER
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            deletedAt: {
                type: Sequelize.DATE
            }
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('Phone');
    }
};
