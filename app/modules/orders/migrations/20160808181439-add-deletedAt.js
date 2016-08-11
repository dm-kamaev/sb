'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.addColumn('Orders', 'deletedAt', {
            type: Sequelize.DATE
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.removeColumn('Orders', 'deletedAt');
    }
};
