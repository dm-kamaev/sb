'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.createTable('UserFund', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            title: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.TEXT
            },
            // creatorId: {
            //   type: Sequelize.INTEGER,
            //   references: {
            //       model: 'Profile',
            //       key: 'id'
            //   }
            // },
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
        queryInterface.dropTable('UserFund');
    }
};
