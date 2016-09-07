'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.renameTable('UserFundSubsription', 'UserFundSubscription')
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.renameTable('UserFundSubscription', 'UserFundSubsription');
  }
};
