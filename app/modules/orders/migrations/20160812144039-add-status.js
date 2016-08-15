'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('Order', 'status', {
            type: Sequelize.STRING
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropColumn('Order', 'status');
    }
};
