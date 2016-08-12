'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.renameColumn('Order', 'listFunds', 'funds');
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.renameColumn('Order', 'funds', 'listFunds');
    }
};
