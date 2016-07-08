'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.addColumn('UserFund', 'draft', {
            type: Sequelize.BOOLEAN,
            allowNull: false
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.removeColumn('UserFund', 'draft');
    }
};
