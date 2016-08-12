'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.renameColumn('Order', 'listDirTopicFunds', 'directionsTopicsFunds');
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.renameColumn('Order', 'directionsTopicsFunds', 'listDirTopicFunds');
    }
};
