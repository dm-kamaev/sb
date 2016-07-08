'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.addColumn('UserFund', 'creatorId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'SberUser',
                key: 'id'
            },
            allowNull: false,
            unique: true
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.removeColumn('UserFund', 'creatorId');
    }
};
