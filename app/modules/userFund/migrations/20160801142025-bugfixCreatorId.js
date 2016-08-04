'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn('UserFund', 'creatorId', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn('UserFund', 'creatorId', {
            type: Sequelize.INTEGER,
            allowNull: false
        });
    }
};
