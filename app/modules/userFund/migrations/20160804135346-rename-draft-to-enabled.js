'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.renameColumn('UserFund', 'draft', 'enabled');
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.renameColumn('UserFund', 'enabled', 'draft');
  }
};
