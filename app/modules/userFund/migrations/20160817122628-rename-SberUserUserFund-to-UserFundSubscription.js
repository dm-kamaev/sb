'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.renameTable('SberUserUserFund',
                    'UserFundSubsription');
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.renameTable('UserFundSubsription',
                    'SberUserUserFund');
  }
};
