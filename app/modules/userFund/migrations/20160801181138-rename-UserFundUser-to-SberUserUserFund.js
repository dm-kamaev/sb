'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.renameTable('UserFundUser', 'SberUserUserFund');
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.renameTable('SberUserUserFund', 'UserFundUser');
    }
};
