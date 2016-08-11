'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.addColumn('Order', 'fundInfo', {
            type: Sequelize.JSON
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.removeColumn('Order', 'fundInfo');
    }
};
